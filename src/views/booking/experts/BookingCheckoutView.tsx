import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Pressable,
  Animated,
  Easing,
  PanResponder,
  ActivityIndicator,
  Alert,
  Platform,
  Keyboard,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import {
  BookingMode,
  BookingOffer,
  BookingRequest,
  SLOT_TAKEN,
  cancelBookingPayment,
  confirmBookingPayment,
  createBookingPaymentIntent,
  fieldError,
  getBookingCheckout,
  getConsultationCheckout,
  ConsultationDraft,
  BookingWindowInput,
} from '../../../services/v2/BookingService';
import { formatLongDate } from '../bookingDates';
import { windowLabel } from '../bookingWindows';
import { formatPrice, initials } from '../bookingFormat';
import { markBookingCompleted } from '../bookingFlow';
import { ShowcaseWebViewModal } from '../components/ShowcaseWebViewModal';
import { useHideFloatingTabBar } from '../useHideFloatingTabBar';
import { useBookingSetup } from '../useBookingSetup';
import { notify } from '../bookingActions';
import { showBookingDialog } from '../components/BookingDialog';
// Stripe : PaymentSheet sur mobile (bookingPayment.tsx), Stripe Elements sur le web (bookingPayment.web.tsx).
import { useBookingPayment } from './bookingPayment';
import { PERIOD_ICONS, PERIOD_LABELS, SelectedBlock, placeLabel } from './components/SlotPicker';
import { MODE_META } from '../components/ModePill';
import { CONSULT_COLOR_DARK, durationText } from '../bookingKinds';

const SHEET_RATIO = 0.92;
const SHEET_RADIUS = 28;
const INSET = Spacings.lg;
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 1.2;

/** Adresse de facturation mémorisée sur l'appareil, à la demande de l'utilisateur. */
const ADDRESS_KEY = '@booking-billing-address';

const IS_WEB = Platform.OS === 'web';
/** Web : fenêtre centrée ; deux colonnes dès que la zone de contenu le permet. */
const WEB_SIDEBAR_WIDTH = 200;
const WEB_TWO_COLUMNS_FROM = 900;
const WEB_DIALOG_WIDE = 980;
const WEB_DIALOG_NARROW = 600;
const WEB_DIALOG_MAX_HEIGHT = 860;
/** Web : la fenêtre apparaît en glissant un peu vers le haut, pas depuis le bas de l'écran. */
const WEB_ENTER_OFFSET = 32;

/** Adresse sur deux lignes : rue, puis code postal et ville. */
const addressLines = (l: { address_line?: string | null; postal_code?: string | null; city?: string | null }) =>
  [l.address_line, [l.postal_code, l.city].filter(Boolean).join(' ')].filter(Boolean) as string[];

const ACCENT = Colors.lblue;
const ACCENT_DARK = Colors.lblueDark;

type Step = 'form' | 'done';

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** « mercredi 21 octobre à 14:00 », dans le fuseau de l'appareil. */
const formatDeadline = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return `${formatLongDate(local, new Date().getFullYear())} à ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * Récapitulatif et paiement d'une demande, en feuille basse (écran « transparentModal »).
 * Couleurs communes de l'espace rendez-vous, pas celles de l'expert : c'est une étape
 * de l'application (identité, facturation, paiement), plus de sa vitrine.
 *
 * Paiement : le montant est seulement réservé sur la carte ; il est débité quand l'expert
 * accepte, libéré s'il refuse ou ne répond pas à temps.
 *
 * Présentiel : chaque demi-journée montre l'adresse complète de son lieu.
 * Pas de message à l'expert ici : la messagerie permet de lui écrire directement.
 * Web : fenêtre centrée ; sur grand écran deux colonnes (rendez-vous à gauche,
 * informations et montant à droite), pied (conditions, paiement) sur toute la largeur.
 */
export const BookingCheckoutView = ({ navigation, route }) => {
  useHideFloatingTabBar(navigation);

  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const contentWidth = IS_WEB ? width - WEB_SIDEBAR_WIDTH : width;
  const twoColumns = IS_WEB && contentWidth >= WEB_TWO_COLUMNS_FROM;
  const dialogWidth = Math.min(twoColumns ? WEB_DIALOG_WIDE : WEB_DIALOG_NARROW, contentWidth - Spacings.lg * 2);
  const sheetHeight = IS_WEB
    ? Math.round(Math.min(height * 0.9, WEB_DIALOG_MAX_HEIGHT))
    : Math.round(height * SHEET_RATIO);
  // Distance de l'animation d'entrée / de sortie.
  const offscreen = IS_WEB ? WEB_ENTER_OFFSET : sheetHeight;
  const queryClient = useQueryClient();

  const expertId: number = route.params?.expertId;
  const offer: BookingOffer = route.params?.offer;
  const expert = route.params?.expert ?? {};
  const blocks: SelectedBlock[] = route.params?.blocks ?? [];
  // Hors calendrier par créneaux : thème (route.params.windows) ou consultation (consultation.windows).
  const windows: BookingWindowInput[] = route.params?.consultation?.windows ?? route.params?.windows ?? [];
  const offerRouteKey: string | undefined = route.params?.offerRouteKey;
  // Consultation sur mesure (v3) : pas de thème, un horaire, toujours en ligne.
  const consultation: ConsultationDraft | undefined = route.params?.consultation;
  // Format choisi sur l'écran du thème ; en ligne par défaut (seul format avant v2).
  const mode: BookingMode = consultation ? 'online' : route.params?.mode ?? 'online';
  // Demi-journées demandées hors calendrier : signalées au serveur.
  const offCalendar = consultation ? consultation.off_calendar : windows.length > 0 || blocks.some((b) => b.off_calendar);

  const payment = useBookingPayment();

  // Expert qui réserve auprès d'un confrère : ses rendez-vous sont dans l'Agenda.
  const { data: me } = useBookingSetup();
  const isExpert = !!me?.is_expert;

  const { data: checkout, isLoading } = useQuery({
    queryKey: consultation
      ? ['booking', 'checkout', 'consultation', expertId, consultation.duration_minutes]
      : ['booking', 'checkout', offer?.id, mode],
    queryFn: () =>
      consultation ? getConsultationCheckout(expertId, consultation.duration_minutes) : getBookingCheckout(offer.id, mode),
    enabled: !!offer || !!consultation,
  });

  const free = checkout ? !checkout.payment_enabled : false;
  // Offre à 0 € : rien à barrer, le total est simplement offert.
  const zeroPrice = checkout?.pricing.amount_ttc === 0;
  const pricing = checkout?.pricing;
  const currency = (pricing?.currency ?? offer?.currency ?? 'eur').toUpperCase();

  /* ---- Saisie ---- */

  const [address, setAddress] = useState('');
  const [rememberAddress, setRememberAddress] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [termsOpen, setTermsOpen] = useState(false);

  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<Step>('form');
  const [result, setResult] = useState<BookingRequest | null>(null);

  // Demande créée côté serveur mais pas encore payée : à annuler si l'on quitte.
  const unpaidBooking = useRef<number | null>(null);
  const busyRef = useRef(false);

  // Adresse manquante : on remonte jusqu'au champ, même si l'utilisateur est en bas.
  const scrollRef = useRef<ScrollView>(null);
  const addressInputRef = useRef<TextInput>(null);
  const identityY = useRef(0);

  // iOS : la feuille est décalée (translateY) ; le calcul automatique des marges du clavier
  // s'y trompait et laissait un grand vide en bas de la liste. On remonte la feuille nous-mêmes
  // de la hauteur du clavier (Android redimensionne déjà la fenêtre).
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const show = Keyboard.addListener('keyboardWillShow', (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardWillHide', () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const revealAddress = () => {
    scrollRef.current?.scrollTo({ y: Math.max(0, identityY.current - Spacings.sm), animated: true });
    // Après le défilement, sinon le clavier se lève pendant l'animation.
    setTimeout(() => addressInputRef.current?.focus(), 350);
  };

  useEffect(() => {
    AsyncStorage.getItem(ADDRESS_KEY)
      .then((saved) => {
        if (saved) setAddress((current) => current || saved);
      })
      .catch(() => {});
  }, []);

  const addressError =
    (submitted && !address.trim() ? 'Veuillez renseigner votre adresse de facturation.' : null) ??
    fieldError(serverErrors, 'address');
  const termsError = submitted && !accepted ? 'Veuillez accepter la politique de confidentialité.' : null;

  /* ---- Ouverture / fermeture ---- */

  const translateY = useRef(new Animated.Value(offscreen)).current;
  const closing = useRef(false);

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: 0,
      duration: 340,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  // Toute sortie passe par ici : pas pendant un paiement, et une demande non payée est abandonnée.
  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (busyRef.current) {
        e.preventDefault();
        return;
      }
      if (closing.current) return;

      e.preventDefault();
      closing.current = true;

      if (unpaidBooking.current) {
        cancelBookingPayment(unpaidBooking.current);
        unpaidBooking.current = null;
      }

      Animated.timing(translateY, {
        toValue: offscreen,
        duration: 240,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => navigation.dispatch(e.data.action));
    });
  }, [navigation, offscreen]);

  const close = () => navigation.goBack();

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => !busyRef.current && g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
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
    inputRange: [0, offscreen],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  /* ---- Envoi ---- */

  const setBusyState = (value: boolean) => {
    busyRef.current = value;
    setBusy(value);
  };

  // Créneau pris entre-temps : retour au calendrier, rafraîchi.
  const backToCalendar = (text?: string | null) => {
    queryClient.invalidateQueries({ queryKey: ['booking', 'availability', expertId] });
    const message = text ?? "Une des demi-journées choisies n'est plus disponible. Merci d'en choisir une autre.";
    const shown = showBookingDialog({
      title: 'Demi-journée indisponible',
      message,
      buttons: [{ text: 'Modifier ma sélection', onPress: close }],
      onDismiss: close,
    });
    if (shown) return;
    if (Platform.OS === 'web') {
      notify('Demi-journée indisponible', message);
      close();
      return;
    }
    Alert.alert('Demi-journée indisponible', message, [{ text: 'Modifier ma sélection', onPress: close }]);
  };

  const finish = async (booking: BookingRequest) => {
    unpaidBooking.current = null;
    try {
      if (rememberAddress) await AsyncStorage.setItem(ADDRESS_KEY, address.trim());
      else await AsyncStorage.removeItem(ADDRESS_KEY);
    } catch (e) {}

    queryClient.invalidateQueries({ queryKey: ['booking', 'availability', expertId] });
    queryClient.invalidateQueries({ queryKey: ['booking', 'requests'] });
    setResult(booking);
    setStep('done');
  };

  const pay = async () => {
    setSubmitted(true);
    setServerErrors({});
    if (!address.trim()) {
      revealAddress();
      return;
    }
    if (!accepted || !checkout || busyRef.current) return;

    setBusyState(true);
    try {
      const intent = await createBookingPaymentIntent(
        consultation
          ? {
              kind: 'consultation',
              expert_id: expertId,
              ...(windows.length > 0
                ? { windows }
                : { date: consultation.date, start_time: consultation.start_local }),
              duration_minutes: consultation.duration_minutes,
              subject: consultation.subject,
              address: address.trim(),
            }
          : {
              offer_id: offer.id,
              mode,
              ...(windows.length > 0
                ? { windows }
                : { blocks: blocks.map((b) => ({ date: b.date, period: b.period })), off_calendar: offCalendar || undefined }),
              address: address.trim(),
            }
      );

      if (intent.ok === false) {
        if (intent.code === SLOT_TAKEN || fieldError(intent.errors, 'blocks') || fieldError(intent.errors, 'start_time') || fieldError(intent.errors, 'date')) {
          backToCalendar(intent.message);
        } else if (fieldError(intent.errors, 'address')) {
          setServerErrors(intent.errors);
          revealAddress();
        } else {
          notify('Envoi impossible', intent.message ?? 'Vérifiez votre connexion puis réessayez.');
        }
        return;
      }

      // Rendez-vous offert : la demande est déjà chez l'expert.
      if (!intent.data.requires_payment) {
        await finish(intent.data.booking);
        return;
      }

      const { booking, client_secret, payment_intent_id, publishable_key } = intent.data;
      unpaidBooking.current = booking.id;

      const paid = await payment.pay({
        clientSecret: client_secret,
        publishableKey: publishable_key,
        billing: { name: checkout.user.name, email: checkout.user.email },
        amountLabel: formatPrice(booking.amount_ttc, currency),
      });
      // Le formulaire de paiement n'a pas pu s'ouvrir : rien n'a été tenté.
      if (paid.status === 'failed' && paid.stage === 'init') {
        notify(paid.title, paid.message);
        return;
      }
      if (paid.status !== 'paid') {
        // Fermeture volontaire : on reste sur le récapitulatif, sans message.
        if (paid.status === 'failed') notify(paid.title, paid.message);
        cancelBookingPayment(booking.id);
        unpaidBooking.current = null;
        return;
      }

      const confirmed = await confirmBookingPayment(booking.id, payment_intent_id);
      if (confirmed.ok === false) {
        if (confirmed.code === SLOT_TAKEN) {
          unpaidBooking.current = null;
          backToCalendar(confirmed.message);
        } else {
          notify(
            'Confirmation en attente',
            confirmed.message ?? "Le paiement n'a pas pu être confirmé. Réessayez dans un instant."
          );
        }
        return;
      }

      await finish(confirmed.data.booking);
    } finally {
      setBusyState(false);
    }
  };

  const done = () => {
    // L'écran de sélection ne doit pas demander « Abandonner votre sélection ? » en se fermant.
    markBookingCompleted(offerRouteKey);
    navigation.popToTop();
    // La demande apparaît aussitôt « En attente » : onglet Rendez-vous, ou Agenda pour un expert.
    if (isExpert) {
      queryClient.invalidateQueries({ queryKey: ['booking', 'expert-agenda'] });
      navigation.getParent('booking-tabs')?.navigate('booking-agenda', { screen: 'agenda-home' });
    } else {
      navigation.getParent('booking-tabs')?.navigate('booking-appointments', { screen: 'appointments-home' });
    }
  };

  if (!offer && !consultation) return null;

  /* ---- Rendu ---- */

  const totalLabel = pricing ? formatPrice(pricing.amount_ttc, currency) : '';
  // Lieux du présentiel (copie de l'offre) : adresse complète des demi-journées choisies.
  const onsiteLocations = offer?.modes?.find((m) => m.mode === 'onsite')?.locations ?? [];
  const year = new Date().getFullYear();

  /* ---- Sections : une colonne (mobile, web étroit) ou deux (web, grand écran) ---- */

  const identitySection = (
    <>
    {/* ---- Vos informations ---- */}
    <Text style={styles.sectionTitle}>Vos informations</Text>
    <View style={styles.card} onLayout={(e) => (identityY.current = e.nativeEvent.layout.y)}>
      <View style={styles.identity}>
        <View style={styles.identityIcon}>
          <Ionicons name="person" size={18} color={ACCENT_DARK} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.identityName} numberOfLines={1}>
            {checkout?.user.name ?? ' '}
          </Text>
          <Text style={styles.identityEmail} numberOfLines={1}>
            {checkout?.user.email ?? ' '}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <Text style={styles.label}>
        Adresse de facturation <Text style={styles.required}>*</Text>
      </Text>
      <TextInput
        ref={addressInputRef}
        style={[styles.input, styles.inputAddress, !!addressError && styles.inputError]}
        value={address}
        onChangeText={setAddress}
        placeholder={'Cabinet, rue, code postal, ville'}
        placeholderTextColor={Colors.subtext}
        multiline
        textAlignVertical="top"
        maxLength={1000}
        editable={!busy}
      />
      {addressError ? <Text style={styles.error}>{addressError}</Text> : null}

      <Pressable
        style={styles.checkRow}
        onPress={() => setRememberAddress((v) => !v)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: rememberAddress }}
      >
        <View style={[styles.checkbox, rememberAddress && styles.checkboxOn]}>
          {rememberAddress && <Ionicons name="checkmark" size={14} color={Colors.white} />}
        </View>
        <Text style={styles.checkText}>Mémoriser cette adresse sur cet appareil</Text>
      </Pressable>
    </View>
    </>
  );

  const appointmentSection = (
    <>
    {/* ---- Votre rendez-vous ---- */}
    <Text style={styles.sectionTitle}>Votre rendez-vous</Text>
    <View style={styles.card}>
      <View style={styles.expertRow}>
        <View style={styles.expertAvatar}>
          {expert.avatar_url ? (
            <Image source={{ uri: expert.avatar_url }} style={StyleSheet.absoluteFill} />
          ) : (
            <Text style={styles.expertInitials}>{initials(expert.name ?? '')}</Text>
          )}
        </View>
        <View style={styles.flex}>
          {expert.honorific ? (
            <Text style={styles.expertHonorific} numberOfLines={1}>
              {expert.honorific}
            </Text>
          ) : null}
          <Text style={styles.expertName} numberOfLines={1}>
            {expert.name}
          </Text>
        </View>
      </View>

      <Text style={styles.offerTitle}>{consultation ? 'Consultation sur mesure' : offer.title}</Text>
      <View style={styles.offerMeta}>
        <MaterialCommunityIcons name={MODE_META[mode].icon} size={15} color={ACCENT_DARK} />
        <Text style={styles.offerMetaText}>
          {MODE_META[mode].label} · {consultation ? durationText(consultation.duration_minutes) : offer.duration_label}
        </Text>
      </View>

      {windows.length > 0 ? (
        // Créneaux proposés : l'expert choisit l'horaire dans l'un d'eux s'il accepte.
        <View style={styles.blocks}>
          {windows.map((w, i) => (
            <View key={i} style={styles.block}>
              <Ionicons name="calendar-outline" size={18} color={ACCENT_DARK} />
              <Text style={styles.blockDate}>
                Créneau {i + 1} · {windowLabel(w, year)}
              </Text>
            </View>
          ))}
          <Text style={styles.blockHours}>
            {mode === 'onsite'
              ? "L'expert choisit l'horaire dans un de ces créneaux, et le lieu, s'il accepte."
              : "L'expert choisit l'horaire dans un de ces créneaux s'il accepte."}
          </Text>
        </View>
      ) : null}

      {consultation ? (
        <View style={styles.blocks}>
          {windows.length === 0 ? (
          <View style={styles.block}>
            <Ionicons name="time-outline" size={18} color={ACCENT_DARK} />
            <Text style={styles.blockDate} numberOfLines={1}>
              {capitalize(formatLongDate(consultation.date, year))}
            </Text>
            <Text style={styles.blockHours}>
              {consultation.start_local} – {consultation.end_local}
              {consultation.off_calendar ? ' · Hors calendrier' : ''}
            </Text>
          </View>
          ) : null}
          <Text style={styles.subjectLabel}>Votre sujet</Text>
          <Text style={styles.subjectText} numberOfLines={6}>
            {consultation.subject}
          </Text>
        </View>
      ) : (
      <View style={styles.blocks}>
        {blocks.map((block) => {
          const longDate = capitalize(formatLongDate(block.date, year));
          return (
            <View key={`${block.date}|${block.period}`} style={styles.block}>
              <MaterialCommunityIcons name={PERIOD_ICONS[block.period]} size={18} color={ACCENT_DARK} />
              <Text style={styles.blockDate} numberOfLines={1}>
                {longDate}
              </Text>
              <Text style={styles.blockHours}>
                {block.off_calendar
                  ? `${PERIOD_LABELS[block.period]} · Hors calendrier`
                  : `${PERIOD_LABELS[block.period]} · ${block.start_local} – ${block.end_local}`}
              </Text>
              {block.off_calendar ? (
                <Text style={styles.blockHours}>
                  {mode === 'onsite'
                    ? "Horaires et lieu confirmés par l'expert s'il accepte."
                    : "Horaires confirmés par l'expert s'il accepte."}
                </Text>
              ) : null}
              {block.location ? (
                // Présentiel : nom du lieu, puis rue, code postal et ville.
                (() => {
                  const full = onsiteLocations.find((l) => l.id === block.location.id);
                  return (
                    <View style={styles.blockPlace}>
                      <Ionicons name="location-outline" size={13} color={ACCENT_DARK} style={styles.blockPlaceIcon} />
                      <View style={styles.flex}>
                        <Text style={styles.blockPlaceName}>{full?.label ?? placeLabel(block.location)}</Text>
                        {full
                          ? addressLines(full).map((line) => (
                              <Text key={line} style={styles.blockHours}>
                                {line}
                              </Text>
                            ))
                          : null}
                      </View>
                    </View>
                  );
                })()
              ) : null}
            </View>
          );
        })}
      </View>
      )}
    </View>
    </>
  );

  const amountSection = (
    <>
    {/* ---- Montant ---- */}
    <Text style={styles.sectionTitle}>Montant</Text>
    <View style={styles.card}>
      {isLoading || !pricing ? (
        <ActivityIndicator color={ACCENT} style={styles.loader} />
      ) : (
        <>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Prix HT</Text>
            <Text style={[styles.amountValue, free && !zeroPrice && styles.struck]}>
              {formatPrice(pricing.amount_ht, currency)}
            </Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>TVA ({pricing.tva_rate.toString().replace('.', ',')} %)</Text>
            <Text style={[styles.amountValue, free && !zeroPrice && styles.struck]}>
              {formatPrice(pricing.tva_amount, currency)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.amountRow}>
            <Text style={styles.totalLabel}>Total TTC</Text>
            {zeroPrice ? (
              <Text style={[styles.totalValue, styles.totalFree]}>Offert</Text>
            ) : free ? (
              <View style={styles.freeTotal}>
                <Text style={[styles.totalStruck, styles.struck]}>{totalLabel}</Text>
                <Text style={[styles.totalValue, styles.totalFree]}>{formatPrice(0, currency)}</Text>
              </View>
            ) : (
              <Text style={styles.totalValue}>{totalLabel}</Text>
            )}
          </View>

          {free ? (
            <View style={[styles.note, styles.noteFree]}>
              <Ionicons name="gift-outline" size={18} color={Colors.success} />
              <Text style={[styles.noteText, { color: Colors.success }]}>
                Rendez-vous offert : aucun paiement ne vous sera demandé.
              </Text>
            </View>
          ) : (
            <View style={styles.note}>
              <Ionicons name="shield-checkmark-outline" size={18} color={ACCENT_DARK} />
              <Text style={styles.noteText}>
                Le montant est seulement réservé sur votre carte. Il n'est débité que si l'expert accepte
                votre demande ; sinon, il est libéré.
              </Text>
            </View>
          )}
        </>
      )}
    </View>
    </>
  );

  return (
    <View style={[styles.root, IS_WEB && styles.rootWeb]}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Fermer le récapitulatif" />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          { height: sheetHeight, transform: [{ translateY }] },
          keyboardHeight > 0 && { paddingBottom: keyboardHeight },
          // Web : fenêtre centrée, arrondie partout, qui apparaît en fondu.
          IS_WEB && [styles.sheetWeb, { width: dialogWidth, opacity: backdropOpacity }],
        ]}
      >
        {/* ---- Zone de prise (mobile : glisser pour fermer) ---- */}
        <View {...(IS_WEB ? {} : pan.panHandlers)} style={[styles.grab, IS_WEB && styles.grabWeb]}>
          {!IS_WEB && <View style={styles.handle} />}
          <View style={styles.titleRow}>
            <Text style={styles.sheetTitle}>{step === 'done' ? 'Demande envoyée' : 'Récapitulatif'}</Text>
            {step === 'form' && (
              <TouchableOpacity style={styles.round} onPress={close} hitSlop={8} accessibilityLabel="Fermer" disabled={busy}>
                <Ionicons name="close" size={22} color={ACCENT_DARK} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {step === 'done' && result ? (
          /* ---- Confirmation ---- */
          <View style={[styles.done, { paddingBottom: Math.max(insets.bottom, Spacings.md) + Spacings.md }]}>
            <View style={styles.doneBody}>
              <View style={styles.doneIcon}>
                <Ionicons name="paper-plane" size={34} color={Colors.white} />
              </View>
              <Text style={styles.doneTitle}>Votre demande est partie</Text>
              <Text style={styles.doneText}>
                {[expert.honorific_short ?? expert.honorific, expert.name].filter(Boolean).join(' ') || "L'expert"} a reçu votre demande
                {result.respond_by ? ` et vous répondra au plus tard le ${formatDeadline(result.respond_by)}.` : '.'}
              </Text>
              {result.payment_required ? (
                <View style={styles.doneNote}>
                  <Ionicons name="lock-closed-outline" size={18} color={ACCENT_DARK} />
                  <Text style={styles.doneNoteText}>
                    {formatPrice(result.amount_ttc, currency)} sont réservés sur votre carte : ils ne seront débités
                    que si l'expert accepte. En cas de refus ou sans réponse, rien n'est prélevé.
                  </Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity style={[styles.button, styles.buttonPrimary]} onPress={done} activeOpacity={0.85}>
              <Text style={styles.buttonPrimaryText}>Terminé</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <ScrollView
              ref={scrollRef}
              style={styles.flex}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              // Pas de rebond ni d'élan au-delà du contenu : la liste s'arrête net à ses bords.
              bounces={false}
              overScrollMode="never"
            >
              {twoColumns ? (
                <View style={styles.webColumns}>
                  <View style={styles.webColumn}>
                    {appointmentSection}
                  </View>
                  <View style={styles.webColumn}>
                    {identitySection}
                    {amountSection}
                  </View>
                </View>
              ) : (
                <>
                  {identitySection}
                  {appointmentSection}
                  {amountSection}
                </>
              )}
            </ScrollView>

            {/* ---- Pied fixe : conditions, retour, paiement ---- */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacings.sm) + Spacings.xs }]}>
              <Pressable
                style={styles.checkRow}
                onPress={() => setAccepted((v) => !v)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: accepted }}
              >
                <View style={[styles.checkbox, accepted && styles.checkboxOn, !!termsError && styles.checkboxError]}>
                  {accepted && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                </View>
                <Text style={styles.checkText}>
                  J'ai lu et j'accepte la{' '}
                  <Text style={styles.link} onPress={() => setTermsOpen(true)} suppressHighlighting>
                    politique de confidentialité
                  </Text>
                </Text>
              </Pressable>
              {termsError ? <Text style={[styles.error, styles.footerError]}>{termsError}</Text> : null}

              <View style={styles.buttons}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonGhost]}
                  onPress={close}
                  disabled={busy}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonGhostText}>Retour</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary, styles.buttonMain, (!checkout || busy) && styles.buttonDisabled]}
                  onPress={pay}
                  disabled={!checkout || busy}
                  activeOpacity={0.85}
                >
                  {busy ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <>
                      <Ionicons name={free ? 'paper-plane-outline' : 'card-outline'} size={18} color={Colors.white} />
                      <Text style={styles.buttonPrimaryText} numberOfLines={1}>
                        {free ? 'Envoyer la demande' : `Payer ${totalLabel}`}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </Animated.View>

      {/* Web : fenêtre de saisie de carte ; mobile : rien (feuille native). */}
      {payment.element}

      <ShowcaseWebViewModal
        visible={termsOpen}
        url={checkout?.terms_url ?? null}
        title="Politique de confidentialité"
        onClose={() => setTermsOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  subjectLabel: {
    marginTop: Spacings.xs,
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: CONSULT_COLOR_DARK,
  },
  subjectText: {
    fontFamily: 'Roboto',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
  },
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
  rootWeb: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetWeb: {
    borderRadius: SHEET_RADIUS,
  },
  grabWeb: {
    paddingTop: Spacings.lg,
  },
  webColumns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.xl,
  },
  webColumn: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.white,
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
    borderColor: Colors.lblue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: INSET,
    paddingBottom: Spacings.xl,
  },

  /* ---- Sections ---- */
  sectionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: Colors.text,
    marginTop: Spacings.lg,
    marginBottom: Spacings.sm,
  },
  card: {
    padding: Spacings.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginVertical: Spacings.md,
  },

  /* ---- Identité et adresse ---- */
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
  },
  identityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityName: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: Colors.text,
  },
  identityEmail: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.subtext,
  },
  label: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.text,
    marginBottom: Spacings.xs,
  },
  required: {
    color: Colors.danger,
  },
  input: {
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: Spacings.sm,
    paddingTop: Spacings.sm,
    paddingBottom: Spacings.sm,
  },
  inputAddress: {
    minHeight: 84,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  error: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.danger,
    marginTop: Spacings.xxs,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    marginTop: Spacings.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: Colors.lblue,
    borderColor: Colors.lblue,
  },
  checkboxError: {
    borderColor: Colors.danger,
  },
  checkText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    lineHeight: 19,
    color: Colors.text,
  },
  link: {
    fontFamily: 'Poppins-Medium',
    color: Colors.lblueDark,
    textDecorationLine: 'underline',
  },

  /* ---- Rendez-vous ---- */
  expertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
  },
  expertAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.lblue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expertInitials: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: Colors.white,
  },
  expertHonorific: {
    fontFamily: 'Poppins-Medium',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.lblueDark,
  },
  expertName: {
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
    color: Colors.text,
  },
  offerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 17,
    lineHeight: 23,
    color: Colors.text,
    marginTop: Spacings.md,
  },
  offerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xxs,
    marginTop: Spacings.xxs,
  },
  offerMetaText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.subtext,
  },
  blocks: {
    marginTop: Spacings.md,
    gap: Spacings.xs,
  },
  block: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: Spacings.xs,
    paddingVertical: Spacings.xs,
    paddingHorizontal: Spacings.sm,
    borderRadius: 12,
    backgroundColor: Colors.grayLight,
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
  // Lieu de la demi-journée (présentiel), sur sa propre ligne.
  blockPlace: {
    flexBasis: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginTop: 2,
  },
  blockPlaceIcon: {
    marginTop: 3,
  },
  blockPlaceName: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: Colors.text,
  },

  /* ---- Montant ---- */
  loader: {
    paddingVertical: Spacings.lg,
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
    fontSize: 16,
    color: Colors.text,
  },
  totalValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: Colors.text,
  },
  totalFree: {
    color: Colors.success,
  },
  freeTotal: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacings.xs,
  },
  totalStruck: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
  },
  struck: {
    textDecorationLine: 'line-through',
    color: Colors.subtext,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.xs,
    marginTop: Spacings.md,
    padding: Spacings.sm,
    borderRadius: 12,
    backgroundColor: Colors.grayLight,
  },
  noteFree: {
    backgroundColor: Colors.successBackground,
  },
  noteText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    lineHeight: 18,
    color: Colors.text,
  },

  /* ---- Pied ---- */
  footer: {
    paddingHorizontal: INSET,
    paddingTop: Spacings.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  footerError: {
    marginLeft: 22 + Spacings.sm,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacings.sm,
    marginTop: Spacings.md,
  },
  button: {
    height: 52,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.xs,
    paddingHorizontal: Spacings.lg,
  },
  buttonMain: {
    flex: 1,
  },
  buttonGhost: {
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  buttonGhostText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: Colors.text,
  },
  buttonPrimary: {
    backgroundColor: Colors.lblue,
  },
  buttonPrimaryText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: Colors.white,
  },
  buttonDisabled: {
    backgroundColor: Colors.disabledBackground,
  },

  /* ---- Confirmation ---- */
  done: {
    flex: 1,
    paddingHorizontal: INSET,
  },
  doneBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.md,
  },
  doneIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.lblue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: Colors.text,
    textAlign: 'center',
  },
  doneText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
    lineHeight: 22,
    color: Colors.subtext,
    textAlign: 'center',
  },
  doneNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.xs,
    padding: Spacings.md,
    borderRadius: 14,
    backgroundColor: Colors.grayLight,
  },
  doneNoteText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    lineHeight: 19,
    color: Colors.text,
  },
});