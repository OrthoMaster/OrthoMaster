import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Pressable,
  Animated,
  Easing,
  PanResponder,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import {
  ExpertRequest,
  ExpertRequestDetail,
  acceptExpertRequest,
  declineExpertRequest,
  fieldError,
  getDeclineReasons,
  getExpertRequest,
  reportExpertNoShow,
} from '../../../services/v2/BookingService';
import { formatLongDate } from '../bookingDates';
import { MODE_SHORT_LABELS, formatPrice, initials } from '../bookingFormat';
import { accentOf, withAlpha } from '../bookingPalette';
import { useBookingSetup } from '../useBookingSetup';
import { JoinVisioButton } from '../components/JoinVisioButton';
import { BlockPlace } from '../components/BlockPlace';
import { NoShowSection } from '../components/NoShowSection';
import { useHideFloatingTabBar } from '../useHideFloatingTabBar';
import { PERIOD_ICONS, PERIOD_LABELS } from '../experts/components/SlotPicker';
import { formatDeadline } from '../appointments/appointmentFormat';
import { REQUESTS_ACCENT, REQUEST_STATUS_META, timeLeft } from './requestFormat';

const SHEET_RATIO = 0.88;
const SHEET_RADIUS = 28;
const INSET = Spacings.lg;
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 1.2;

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Phrase d'explication sous l'état, du point de vue de l'expert. */
const statusText = (request: ExpertRequest): string => {
  switch (request.status) {
    case 'pending': {
      const left = timeLeft(request.respond_by);
      return request.respond_by
        ? `Merci de répondre avant le ${formatDeadline(request.respond_by)}${left ? ` (encore ${left.label})` : ''}. Sans réponse, la demande expire et les demi-journées redeviennent disponibles.`
        : 'Cette demande attend votre réponse.';
    }
    case 'accepted':
      return 'Vous avez accepté ce rendez-vous. Il apparaît dans votre agenda.';
    case 'completed':
      return 'Ce rendez-vous a eu lieu.';
    case 'declined':
      return 'Vous avez refusé cette demande. Le confrère en a été informé.';
    case 'expired':
      return "Cette demande a expiré sans réponse. Les demi-journées ont été libérées.";
    case 'cancelled':
      return 'Le confrère a retiré sa demande.';
  }
};

/**
 * Fiche d'une demande reçue, en feuille basse : demandeur, demi-journées, message,
 * rémunération. Tant qu'elle attend, l'expert accepte (le montant réservé est débité)
 * ou refuse avec un motif (l'empreinte est libérée).
 */
export const RequestDetailView = ({ navigation, route }) => {
  useHideFloatingTabBar(navigation);

  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const sheetHeight = Math.round(height * SHEET_RATIO);
  const queryClient = useQueryClient();
  const { setup } = useBookingSetup();
  const accent = accentOf(setup?.expert?.palette_color);

  const bookingId: number = route.params?.bookingId;
  const preview: ExpertRequest | undefined = route.params?.preview;

  const detailKey = ['booking', 'expert-request', bookingId];
  const { data: detail } = useQuery({
    queryKey: detailKey,
    queryFn: () => getExpertRequest(bookingId),
  });

  const request: ExpertRequest | ExpertRequestDetail | undefined = detail ?? preview;
  const full = detail ?? null;

  /* ---- Refus : motif et note ---- */
  const [declining, setDeclining] = useState(false);
  const [reasonId, setReasonId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null);

  const { data: reasons } = useQuery({
    queryKey: ['booking', 'decline-reasons'],
    queryFn: () => getDeclineReasons(),
    enabled: declining,
    staleTime: 10 * 60 * 1000,
  });
  const noteMax = reasons?.note_max ?? 300;

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

  /* ---- Réponse ---- */

  const applyResult = (next: ExpertRequestDetail) => {
    queryClient.setQueryData(detailKey, next);
    queryClient.invalidateQueries({ queryKey: ['booking', 'expert-requests'] });
    queryClient.invalidateQueries({ queryKey: ['booking', 'expert-agenda'] });
    animateFooter();
    setDeclining(false);
  };

  const accept = () => {
    Alert.alert(
      'Accepter la demande ?',
      full?.payment_required
        ? 'Le montant réservé sur la carte du confrère sera débité et le rendez-vous confirmé.'
        : 'Le rendez-vous sera confirmé auprès du confrère.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Accepter',
          onPress: async () => {
            setBusy('accept');
            const result = await acceptExpertRequest(bookingId);
            setBusy(null);

            if (result.ok === false) {
              // Délai dépassé ou demande déjà tranchée : la fiche affiche le nouvel état.
              queryClient.invalidateQueries({ queryKey: detailKey });
              queryClient.invalidateQueries({ queryKey: ['booking', 'expert-requests'] });
              Alert.alert('Acceptation impossible', result.message ?? 'Vérifiez votre connexion puis réessayez.');
              return;
            }
            applyResult(result.data);
          },
        },
      ]
    );
  };

  // Le pied se déplie et se replie en douceur.
  const animateFooter = () => LayoutAnimation.configureNext(LayoutAnimation.create(220, 'easeInEaseOut', 'opacity'));

  const openDecline = () => {
    animateFooter();
    setDeclining(true);
  };

  const closeDecline = () => {
    animateFooter();
    setDeclining(false);
    setSubmitted(false);
  };

  const confirmDecline = async () => {
    setSubmitted(true);
    if (!reasonId) return;

    setBusy('decline');
    const result = await declineExpertRequest(bookingId, { reason_id: reasonId, note: note.trim() || null });
    setBusy(null);

    if (result.ok === false) {
      const message = fieldError(result.errors, 'reason_id') ?? fieldError(result.errors, 'note') ?? result.message;
      queryClient.invalidateQueries({ queryKey: ['booking', 'expert-requests'] });
      Alert.alert('Refus impossible', message ?? 'Vérifiez votre connexion puis réessayez.');
      return;
    }
    applyResult(result.data);
  };

  if (!request) return null;

  const meta = REQUEST_STATUS_META[request.status];
  const year = new Date().getFullYear();
  const currency = (full?.currency ?? 'eur').toUpperCase();
  const canRespond = full?.can_respond ?? false;

  return (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Fermer" />
      </Animated.View>

      <Animated.View style={[styles.sheet, { height: sheetHeight, transform: [{ translateY }] }]}>
        {/* Le pied remonte avec le clavier quand on écrit la note ; la zone défilante se réduit. */}
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View {...pan.panHandlers} style={styles.grab}>
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <Text style={styles.sheetTitle}>Demande</Text>
            <TouchableOpacity style={styles.round} onPress={close} hitSlop={8} accessibilityLabel="Fermer">
              <Ionicons name="close" size={22} color={REQUESTS_ACCENT} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.content,
            // Avec le pied fixe, la marge de sécurité basse est déjà prise par lui.
            { paddingBottom: canRespond ? Spacings.lg : Math.max(insets.bottom, Spacings.md) + Spacings.lg },
          ]}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          {/* ---- État ---- */}
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
            <Text style={styles.statusText}>{statusText(request)}</Text>
            {full?.decline_reason ? (
              <Text style={styles.statusText}>
                <Text style={styles.statusStrong}>Motif : </Text>
                {full.decline_reason}
              </Text>
            ) : null}
            {full?.decline_note ? <Text style={styles.statusNote}>« {full.decline_note} »</Text> : null}
          </View>

          {/* ---- Demandeur et thème ---- */}
          <View style={styles.card}>
            <View style={styles.expertRow}>
              <View style={[styles.avatar, { backgroundColor: withAlpha(REQUESTS_ACCENT, 0.15) }]}>
                <Text style={[styles.initials, { color: REQUESTS_ACCENT }]}>{initials(request.requester.name)}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.honorific}>Demande de</Text>
                <Text style={styles.name} numberOfLines={1}>
                  {request.requester.name}
                </Text>
              </View>
            </View>

            <Text style={styles.offerTitle}>{request.offer_title}</Text>
            <View style={styles.modeRow}>
              <Ionicons
                name={request.mode === 'onsite' ? 'location-outline' : 'videocam-outline'}
                size={15}
                color={Colors.lblueDark}
              />
              <Text style={styles.modeText}>{MODE_SHORT_LABELS[request.mode ?? 'online']}</Text>
            </View>

            <Text style={styles.blocksTitle}>
              {request.blocks.length > 1 ? `${request.blocks.length} demi-journées` : '1 demi-journée'}
            </Text>
            <View style={styles.blocks}>
              {request.blocks.map((block) => (
                <View key={`${block.date}|${block.period}`} style={styles.block}>
                  <MaterialCommunityIcons name={PERIOD_ICONS[block.period]} size={18} color={Colors.lblueDark} />
                  <View style={styles.flex}>
                    <Text style={styles.blockDate}>{capitalize(formatLongDate(block.date, year))}</Text>
                    <Text style={styles.blockHours}>
                      {PERIOD_LABELS[block.period]} · {block.start_local} – {block.end_local}
                    </Text>
                    {block.location ? <BlockPlace location={block.location} color={accent} /> : null}
                    {/* Visio seulement en ligne ; en présentiel, le lieu ci-dessus. */}
                    {request.status === 'accepted' && request.mode !== 'onsite' ? (
                      <View style={styles.join}>
                        <JoinVisioButton
                          startAt={block.start_at}
                          endAt={block.end_at}
                          url={block.meet_url}
                          color={accent}
                          compact
                        />
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {full ? (
            <>
              {/* ---- Message du demandeur ---- */}
              {full.message ? (
                <>
                  <Text style={styles.sectionTitle}>Son message</Text>
                  <View style={styles.card}>
                    <Text style={styles.body}>{full.message}</Text>
                  </View>
                </>
              ) : null}

              {/* ---- Rémunération ---- */}
              <Text style={styles.sectionTitle}>Rémunération</Text>
              <View style={styles.card}>
                {full.payment_required ? (
                  <>
                    <View style={styles.amountRow}>
                      <Text style={styles.amountLabel}>Prix du thème (HT)</Text>
                      <Text style={styles.amountValue}>{formatPrice(full.amount_ht, currency)}</Text>
                    </View>
                    <View style={styles.amountRow}>
                      <Text style={styles.amountLabel}>
                        Commission OrthoMaster ({String(full.commission_rate).replace('.', ',')} %)
                      </Text>
                      <Text style={styles.amountValue}>
                        − {formatPrice(Math.round((full.amount_ht - full.payout) * 100) / 100, currency)}
                      </Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.amountRow}>
                      <Text style={styles.totalLabel}>Vous recevrez (HT)</Text>
                      <Text style={styles.payoutValue}>{formatPrice(full.payout, currency)}</Text>
                    </View>
                    <Text style={styles.hint}>
                      Le montant est débité au confrère au moment où vous acceptez la demande.
                    </Text>
                  </>
                ) : (
                  <Text style={styles.body}>Rendez-vous offert : aucun paiement n'est associé à cette demande.</Text>
                )}
              </View>


              {/* ---- Absence : rendez-vous accepté, du début à 24 h après la fin ---- */}
              {full.noshow && (full.noshow.can_report || full.noshow.report) ? (
                <>
                  <Text style={styles.sectionTitle}>Actions</Text>
                  <NoShowSection
                    noshow={full.noshow}
                    blocks={full.blocks}
                    counterpart="le confrère"
                    onSubmit={(input) => reportExpertNoShow(bookingId, input)}
                    onDone={(next) => queryClient.setQueryData(detailKey, next)}
                  />
                </>
              ) : null}
            </>
          ) : (
            <ActivityIndicator color={REQUESTS_ACCENT} style={styles.loader} />
          )}
        </ScrollView>

        {/* ---- Pied fixe : réponse ; « Refuser » le déplie pour choisir le motif ---- */}
        {canRespond ? (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacings.sm) + Spacings.xs }]}>
            {declining ? (
              <>
                <View style={styles.footerHead}>
                  <Text style={styles.footerTitle}>Motif du refus</Text>
                  {submitted && !reasonId ? <Text style={styles.error}>Veuillez choisir un motif.</Text> : null}
                </View>

                {!reasons ? (
                  <ActivityIndicator color={REQUESTS_ACCENT} style={styles.loader} />
                ) : (
                  <ScrollView style={styles.reasons} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {reasons.reasons.map((reason) => {
                      const on = reason.id === reasonId;
                      return (
                        <Pressable
                          key={reason.id}
                          style={styles.reason}
                          onPress={() => setReasonId(reason.id)}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: on }}
                        >
                          <View style={[styles.radio, on && styles.radioOn]}>{on && <View style={styles.radioDot} />}</View>
                          <Text style={styles.reasonText}>{reason.label}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                )}

                <TextInput
                  style={styles.noteInput}
                  value={note}
                  onChangeText={setNote}
                  placeholder="Un mot pour le confrère (facultatif)"
                  placeholderTextColor={Colors.subtext}
                  multiline
                  textAlignVertical="top"
                  maxLength={noteMax}
                  editable={busy === null}
                />
                <Text style={styles.counter}>
                  {note.length} / {noteMax}
                </Text>

                <View style={styles.footerButtons}>
                  <TouchableOpacity
                    style={[styles.footerButton, styles.footerGhost]}
                    onPress={closeDecline}
                    disabled={busy !== null}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.footerGhostText}>Retour</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.footerButton, styles.footerDanger]}
                    onPress={confirmDecline}
                    disabled={busy !== null}
                    activeOpacity={0.85}
                  >
                    {busy === 'decline' ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Text style={styles.footerSolidText}>Confirmer le refus</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.footerButtons}>
                <TouchableOpacity
                  style={[styles.footerButton, styles.footerDeclineOutline]}
                  onPress={openDecline}
                  disabled={busy !== null}
                  activeOpacity={0.8}
                >
                  <Text style={styles.footerDeclineText}>Refuser</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.footerButton, styles.footerAccept]}
                  onPress={accept}
                  disabled={busy !== null}
                  activeOpacity={0.85}
                >
                  {busy === 'accept' ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Text style={styles.footerSolidText}>Accepter</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : null}
        </KeyboardAvoidingView>
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
    borderColor: withAlpha(REQUESTS_ACCENT, 0.45),
    backgroundColor: withAlpha(REQUESTS_ACCENT, 0.1),
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
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xxs,
    marginTop: Spacings.xxs,
  },
  modeText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: Colors.lblueDark,
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

  /* ---- Actions ---- */

  /* ---- Rémunération ---- */
  payoutValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: Colors.success,
  },
  hint: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    lineHeight: 17,
    color: Colors.subtext,
    marginTop: Spacings.xs,
  },

  /* ---- Réponse ---- */
  reason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    paddingVertical: Spacings.sm,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    borderColor: Colors.danger,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.danger,
  },
  reasonText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: Colors.text,
  },
  noteInput: {
    minHeight: 64,
    maxHeight: 110,
    marginTop: Spacings.sm,
    padding: Spacings.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: Colors.text,
  },
  counter: {
    alignSelf: 'flex-end',
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.subtext,
    marginTop: Spacings.xxs,
  },
  error: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.danger,
    marginTop: Spacings.xxs,
  },

  /* ---- Pied fixe ---- */
  footer: {
    paddingHorizontal: INSET,
    paddingTop: Spacings.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  footerHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacings.sm,
  },
  footerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: Colors.text,
  },
  reasons: {
    maxHeight: 200,
    marginTop: Spacings.xs,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: Spacings.sm,
    marginTop: Spacings.sm,
  },
  footerButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerAccept: {
    backgroundColor: Colors.success,
  },
  footerDanger: {
    backgroundColor: Colors.danger,
  },
  footerDeclineOutline: {
    borderWidth: 1,
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerBackground,
  },
  footerDeclineText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: Colors.danger,
  },
  footerGhost: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  footerGhostText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: Colors.text,
  },
  footerSolidText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: Colors.white,
  },
});