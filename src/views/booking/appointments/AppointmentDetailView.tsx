import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Animated,
  Easing,
  PanResponder,
  ActivityIndicator,
  Alert,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import { MyBooking, MyBookingDetail, cancelMyBooking, getMyBooking, reportMyNoShow } from '../../../services/v2/BookingService';
import { formatLongDate } from '../bookingDates';
import { formatPrice, initials } from '../bookingFormat';
import { accentOf, withAlpha } from '../bookingPalette';
import { JoinVisioButton } from '../components/JoinVisioButton';
import { NoShowSection } from '../components/NoShowSection';
import { useHideFloatingTabBar } from '../useHideFloatingTabBar';
import { PERIOD_ICONS, PERIOD_LABELS } from '../experts/components/SlotPicker';
import { APPOINTMENTS_ACCENT, STATUS_META, formatDeadline } from './appointmentFormat';

const SHEET_RATIO = 0.88;
const SHEET_RADIUS = 28;
const INSET = Spacings.lg;
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 1.2;

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Phrase d'explication sous l'état : ce qui se passe et ce qu'il advient de l'argent. */
const statusText = (booking: MyBooking): string => {
  const expert = [booking.expert?.honorific, booking.expert?.name].filter(Boolean).join(' ') || "L'expert";
  const free = !booking.payment_required;

  switch (booking.status) {
    case 'pending':
      return `Votre rendez-vous attend la confirmation de l'expert.${
        booking.respond_by ? ` Vous recevrez sa réponse au plus tard le ${formatDeadline(booking.respond_by)}.` : ''
      }`;
    case 'accepted':
      return 'Rendez-vous confirmé. Le lien de la visio sera disponible ici avant la première demi-journée.';
    case 'completed':
      // Remboursement après un signalement d'absence traité par OrthoMaster.
      return booking.refunded_amount > 0 ? `Ce rendez-vous a eu lieu. ${refundText(booking)}` : 'Ce rendez-vous a eu lieu.';
    case 'declined':
      return `${expert} n'a pas pu accepter votre demande.${free ? '' : " Aucun montant n'a été débité."}`;
    case 'expired':
      return `${expert} n'a pas répondu dans les délais.${free ? '' : " Aucun montant n'a été débité."}`;
    case 'cancelled': {
      const charged = booking.charged_amount > 0;
      const intro =
        booking.cancelled_by === 'expert'
          ? `${expert} a annulé ce rendez-vous.`
          : charged
          ? 'Ce rendez-vous a été annulé.'
          : 'Vous avez annulé cette demande.';
      if (free) return intro;
      return `${intro} ${charged ? refundText(booking) : "Aucun montant n'a été débité."}`;
    }
  }
};

/** Ce qui a été remboursé d'un montant débité. */
const refundText = (booking: MyBooking): string => {
  const refunded = booking.refunded_amount ?? 0;
  if (refunded <= 0) return "Le montant débité n'a pas été remboursé.";
  if (refunded >= booking.charged_amount - 0.005) return 'Le montant débité vous a été remboursé intégralement.';
  return `${formatPrice(refunded, booking.currency)} vous ont été remboursés.`;
};

/**
 * Fiche d'un rendez-vous en feuille basse : état, expert, demi-journées, message,
 * facturation. Une demande sans réponse peut être retirée gratuitement.
 * S'ouvre aussitôt avec l'aperçu de la liste, complété par la fiche du serveur.
 */
export const AppointmentDetailView = ({ navigation, route }) => {
  useHideFloatingTabBar(navigation);

  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const sheetHeight = Math.round(height * SHEET_RATIO);
  const queryClient = useQueryClient();

  const bookingId: number = route.params?.bookingId;
  const preview: MyBooking | undefined = route.params?.preview;

  const { data: detail } = useQuery({
    queryKey: ['booking', 'request', bookingId],
    queryFn: () => getMyBooking(bookingId),
  });

  const booking: MyBooking | MyBookingDetail | undefined = detail ?? preview;
  const full = detail ?? null;
  const [cancelling, setCancelling] = useState(false);

  /* ---- Ouverture / fermeture ---- */

  const translateY = useRef(new Animated.Value(sheetHeight)).current;
  const closing = useRef(false);

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: 0,
      duration: 340,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (closing.current) return;
      e.preventDefault();
      closing.current = true;
      Animated.timing(translateY, {
        toValue: sheetHeight,
        duration: 240,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => navigation.dispatch(e.data.action));
    });
  }, [navigation, sheetHeight]);

  const close = () => navigation.goBack();

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_, g) => translateY.setValue(Math.max(0, g.dy)),
        onPanResponderRelease: (_, g) => {
          if (g.dy > DISMISS_DISTANCE || g.vy > DISMISS_VELOCITY) {
            close();
          } else {
            Animated.spring(translateY, { toValue: 0, friction: 8, tension: 80, useNativeDriver: true }).start();
          }
        },
      }),
    []
  );

  const backdropOpacity = translateY.interpolate({
    inputRange: [0, sheetHeight],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  /* ---- Retrait de la demande ---- */

  const cancel = () => {
    Alert.alert(
      'Annuler la demande ?',
      booking?.payment_required
        ? "L'expert ne la recevra plus et le montant réservé sur votre carte sera libéré."
        : "L'expert ne la recevra plus.",
      [
        { text: 'Garder', style: 'cancel' },
        {
          text: 'Annuler la demande',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            const result = await cancelMyBooking(bookingId);
            setCancelling(false);

            if (result.ok === false) {
              Alert.alert('Annulation impossible', result.message ?? 'Vérifiez votre connexion puis réessayez.');
              return;
            }
            queryClient.setQueryData(['booking', 'request', bookingId], result.data);
            queryClient.invalidateQueries({ queryKey: ['booking', 'requests'] });
          },
        },
      ]
    );
  };

  if (!booking) return null;

  const meta = STATUS_META[booking.status];
  const expert = booking.expert;
  const currency = booking.currency.toUpperCase();
  const year = new Date().getFullYear();

  return (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Fermer" />
      </Animated.View>

      <Animated.View style={[styles.sheet, { height: sheetHeight, transform: [{ translateY }] }]}>
        <View {...pan.panHandlers} style={styles.grab}>
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <Text style={styles.sheetTitle}>Rendez-vous</Text>
            <TouchableOpacity style={styles.round} onPress={close} hitSlop={8} accessibilityLabel="Fermer">
              <Ionicons name="close" size={22} color={APPOINTMENTS_ACCENT} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, Spacings.md) + Spacings.lg }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ---- État ---- */}
          {/* Liseré et bordure de la couleur de l'état : le bloc se détache du fond gris, même pour les états neutres. */}
          <View
            style={[
              styles.status,
              {
                backgroundColor: meta.background === Colors.grayLight ? Colors.white : meta.background,
                borderColor: withAlpha(meta.color, 0.35),
                borderLeftColor: meta.color,
              },
            ]}
          >
            <View style={styles.statusHead}>
              <Ionicons name={meta.icon} size={18} color={meta.color} />
              <Text style={[styles.statusLabel, { color: meta.color }]}>{meta.label}</Text>
            </View>
            <Text style={styles.statusText}>{statusText(booking)}</Text>
            {full?.decline_reason ? (
              <Text style={styles.statusText}>
                <Text style={styles.statusStrong}>Motif : </Text>
                {full.decline_reason}
              </Text>
            ) : null}
            {full?.decline_note ? <Text style={styles.statusNote}>« {full.decline_note} »</Text> : null}
          </View>

          {/* ---- Expert et thème ---- */}
          <View style={styles.card}>
            <View style={styles.expertRow}>
              <View style={styles.avatar}>
                {expert?.avatar_url ? (
                  <Image source={{ uri: expert.avatar_url }} style={StyleSheet.absoluteFill} />
                ) : (
                  <Text style={styles.initials}>{initials(expert?.name ?? '')}</Text>
                )}
              </View>
              <View style={styles.flex}>
                {expert?.honorific ? <Text style={styles.honorific}>{expert.honorific}</Text> : null}
                <Text style={styles.name} numberOfLines={1}>
                  {expert?.name ?? 'Expert'}
                </Text>
              </View>
            </View>

            <Text style={styles.offerTitle}>{booking.offer_title}</Text>

            <Text style={styles.blocksTitle}>
              {booking.blocks.length > 1 ? `${booking.blocks.length} demi-journées` : '1 demi-journée'}
            </Text>
            <View style={styles.blocks}>
              {booking.blocks.map((block) => (
                <View key={`${block.date}|${block.period}`} style={styles.block}>
                  <MaterialCommunityIcons name={PERIOD_ICONS[block.period]} size={18} color={Colors.lblueDark} />
                  <View style={styles.flex}>
                    <Text style={styles.blockDate}>{capitalize(formatLongDate(block.date, year))}</Text>
                    <Text style={styles.blockHours}>
                      {PERIOD_LABELS[block.period]} · {block.start_local} – {block.end_local}
                    </Text>
                    {booking.status === 'accepted' ? (
                      <View style={styles.join}>
                        <JoinVisioButton
                          startAt={block.start_at}
                          endAt={block.end_at}
                          url={block.meet_url}
                          color={accentOf(expert?.palette_color)}
                          compact
                        />
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* ---- Message et facturation : fiche complète uniquement ---- */}
          {full ? (
            <>
              {full.message ? (
                <>
                  <Text style={styles.sectionTitle}>Votre message</Text>
                  <View style={styles.card}>
                    <Text style={styles.body}>{full.message}</Text>
                  </View>
                </>
              ) : null}

              <Text style={styles.sectionTitle}>Facturation</Text>
              <View style={styles.card}>
                <Text style={styles.label}>Adresse</Text>
                <Text style={styles.body}>{full.client_address}</Text>

                <View style={styles.divider} />

                {full.payment_required ? (
                  <>
                    <View style={styles.amountRow}>
                      <Text style={styles.amountLabel}>Prix HT</Text>
                      <Text style={styles.amountValue}>{formatPrice(full.amount_ht, currency)}</Text>
                    </View>
                    <View style={styles.amountRow}>
                      <Text style={styles.amountLabel}>TVA ({String(full.tva_rate).replace('.', ',')} %)</Text>
                      <Text style={styles.amountValue}>{formatPrice(full.tva_amount, currency)}</Text>
                    </View>
                    <View style={styles.amountRow}>
                      <Text style={styles.totalLabel}>Total TTC</Text>
                      <Text style={styles.totalValue}>{formatPrice(full.amount_ttc, currency)}</Text>
                    </View>
                    {full.refunded_amount > 0 ? (
                      <>
                        <View style={styles.divider} />
                        <View style={styles.amountRow}>
                          <Text style={styles.amountLabel}>Débité</Text>
                          <Text style={styles.amountValue}>{formatPrice(full.charged_amount, currency)}</Text>
                        </View>
                        <View style={styles.amountRow}>
                          <Text style={styles.amountLabel}>Remboursé</Text>
                          <Text style={[styles.amountValue, { color: Colors.success }]}>
                            − {formatPrice(full.refunded_amount, currency)}
                          </Text>
                        </View>
                        {full.refunded_amount >= full.charged_amount - 0.005 ? (
                          <Text style={styles.refundNote}>Remboursé intégralement</Text>
                        ) : (
                          <View style={styles.amountRow}>
                            <Text style={styles.totalLabel}>Reste payé</Text>
                            <Text style={styles.totalValue}>
                              {formatPrice(full.charged_amount - full.refunded_amount, currency)}
                            </Text>
                          </View>
                        )}
                      </>
                    ) : null}
                  </>
                ) : (
                  <View style={styles.amountRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={[styles.totalValue, { color: Colors.success }]}>Offert</Text>
                  </View>
                )}
              </View>

              {/* Actions alignées à gauche ; le téléchargement de la facture viendra ici. */}
              {full.can_cancel || full.noshow?.can_report || full.noshow?.report ? (
                <>
                  <Text style={styles.sectionTitle}>Actions</Text>
                  {full.can_cancel ? (
                    <View style={styles.actions}>
                      <TouchableOpacity style={styles.cancel} onPress={cancel} disabled={cancelling} activeOpacity={0.8}>
                        {cancelling ? (
                          <ActivityIndicator size="small" color={Colors.danger} />
                        ) : (
                          <Text style={styles.cancelText}>Annuler la demande</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : null}
                  {full.noshow ? (
                    <NoShowSection
                      noshow={full.noshow}
                      blocks={full.blocks}
                      counterpart="l'expert"
                      onSubmit={(input) => reportMyNoShow(bookingId, input)}
                      onDone={(next) => queryClient.setQueryData(['booking', 'request', bookingId], next)}
                    />
                  ) : null}
                </>
              ) : null}
            </>
          ) : (
            <ActivityIndicator color={APPOINTMENTS_ACCENT} style={styles.loader} />
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  /* ---- Feuille ---- */
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    backgroundColor: Colors.grayLight,
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
    overflow: 'hidden',
  },
  grab: {
    paddingHorizontal: INSET,
    paddingTop: Spacings.sm,
    paddingBottom: Spacings.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.border,
    marginBottom: Spacings.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: Colors.text,
  },
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: withAlpha(APPOINTMENTS_ACCENT, 0.45),
    backgroundColor: withAlpha(APPOINTMENTS_ACCENT, 0.1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: INSET,
    gap: Spacings.md,
  },
  loader: {
    paddingVertical: Spacings.lg,
  },

  /* ---- État ---- */
  status: {
    padding: Spacings.md,
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 3,
    gap: Spacings.xs,
  },
  statusHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  statusLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
  },
  statusStrong: {
    fontFamily: 'Poppins-Medium',
  },
  statusNote: {
    fontFamily: 'Poppins-Regular',
    fontStyle: 'italic',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.subtext,
  },
  statusText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
  },

  /* ---- Cartes ---- */
  card: {
    padding: Spacings.md,
    borderRadius: 18,
    backgroundColor: Colors.white,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: Colors.text,
    marginBottom: -Spacings.xs,
  },
  expertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: Colors.lblue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: Colors.white,
  },
  honorific: {
    fontFamily: 'Poppins-Medium',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.lblueDark,
  },
  name: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: Colors.text,
  },
  offerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    lineHeight: 24,
    color: Colors.text,
    marginTop: Spacings.md,
  },
  blocksTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.subtext,
    marginTop: Spacings.md,
  },
  blocks: {
    gap: Spacings.xs,
    marginTop: Spacings.xs,
  },
  block: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    padding: Spacings.sm,
    borderRadius: 12,
    backgroundColor: Colors.grayLight,
  },
  join: {
    marginTop: Spacings.xs,
  },
  blockDate: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.text,
  },
  blockHours: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.subtext,
  },
  label: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: Colors.subtext,
    marginBottom: Spacings.xxs,
  },
  body: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginVertical: Spacings.md,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacings.xxs,
  },
  amountLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: Colors.subtext,
  },
  amountValue: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.text,
  },
  totalLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: Colors.text,
  },
  totalValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: Colors.text,
  },
  refundNote: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: Colors.success,
    textAlign: 'right',
    marginTop: Spacings.xxs,
  },

  /* ---- Actions ---- */
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.sm,
  },
  cancel: {
    height: 40,
    minWidth: 160,
    paddingHorizontal: Spacings.md,
    borderRadius: 10,
    backgroundColor: Colors.dangerBackground,
    borderWidth: 1,
    borderColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cancelText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.danger,
  },
});