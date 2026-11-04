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
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import {
  BookingExpertListItem,
  BookingExpertMedia,
  BookingOffer,
  getBookingExpert,
  getBookingExpertMedias,
} from '../../../services/v2/BookingService';
import { initials, priceLabel } from '../bookingFormat';
import { CONSULT_COLOR, CONSULT_COLOR_DARK, CONSULT_SOFT } from '../bookingKinds';
import { withAlpha } from '../bookingPalette';
import { ExpertTheme, expertTheme } from '../expertTheme';
import { ThemeBackdrop } from '../components/ThemeBackdrop';
import { useHideFloatingTabBar } from '../useHideFloatingTabBar';
import { OfferCarousel } from './components/OfferCarousel';

/** La feuille occupe 90 % de l'écran ; l'avatar dépasse de moitié au-dessus. */
const SHEET_RATIO = 0.8;
const SHEET_RADIUS = 28;
const INSET = Spacings.lg;

/**
 * Avatar de la page vitrine : photo, anneau de la couleur du fond (6 px), puis filet
 * de la couleur principale (1,5 px). CSS : box-shadow 0 0 0 6px bg, 0 0 0 7.5px teal.
 */
const PHOTO_SIZE = 84;
const AVATAR_GAP = 6;
const AVATAR_RING = 1.5;
const AVATAR_SIZE = PHOTO_SIZE + (AVATAR_GAP + AVATAR_RING) * 2;

const IS_WEB = Platform.OS === 'web';
/** Web : panneau à droite, sur toute la hauteur ; largeur selon la zone de contenu (hors barre latérale). */
const WEB_SIDEBAR_WIDTH = 200;
const WEB_PANEL_MIN = 440;
const WEB_PANEL_MAX = 620;
const WEB_PANEL_RADIUS = 24;

/** Glisser la feuille vers le bas au-delà de ce seuil (ou d'un geste rapide) la ferme. */
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 1;

/** Au-delà de deux lignes, la présentation se replie derrière « Lire la suite ». */
const LEDE_LINES = 2;

/** Nom sur deux lignes comme le h1 de la page vitrine : prénom, puis le reste. */
const nameLines = (name: string) => {
  return [name];
  // const words = name.trim().split(/\s+/);
  // return words.length < 2 ? [name] : [words[0], words.slice(1).join(' ')];
};

/**
 * Présentation repliable : une copie invisible mesure le texte complet,
 * le lien n'apparaît que s'il dépasse réellement deux lignes.
 */
const Lede = ({ text, theme }: { text: string; theme: ExpertTheme }) => {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  return (
    <Pressable onPress={() => overflows && setExpanded((e) => !e)} disabled={!overflows}>
      <Text
        style={[styles.lede, styles.measure]}
        onTextLayout={(e) => setOverflows(e.nativeEvent.lines.length > LEDE_LINES)}
        aria-hidden
      >
        {text}
      </Text>
      <Text style={[styles.lede, { color: theme.muted }]} numberOfLines={expanded ? undefined : LEDE_LINES}>
        {text}
      </Text>
      {overflows && (
        <Text style={[styles.more, { color: theme.primary }]}>{expanded ? 'Réduire' : 'Lire la suite'}</Text>
      )}
    </Pressable>
  );
};

/**
 * Profil d'un expert en feuille basse (écran « transparentModal » de ExpertsStack).
 * Web : panneau qui glisse depuis la droite sur toute la hauteur, la liste reste visible
 * derrière le voile (clic à côté ou croix pour fermer).
 * Habillage repris de sa page vitrine web : fond à halo radial, couleurs et typographie
 * du thème de sa palette. Thèmes en carrousel : la carte affichée est celle réservée.
 */
export const ExpertProfileView = ({ navigation, route }) => {
  useHideFloatingTabBar(navigation);

  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const sheetHeight = Math.round(height * SHEET_RATIO);
  const panelWidth = Math.round(
    Math.min(WEB_PANEL_MAX, Math.max(WEB_PANEL_MIN, (width - WEB_SIDEBAR_WIDTH) * 0.5), width)
  );
  // Distance hors écran : vers le bas sur mobile, vers la droite sur le web.
  const offscreen = IS_WEB ? panelWidth : sheetHeight;
  const contentWidth = IS_WEB ? panelWidth : width;

  const expertId: number = route.params?.expertId;
  const preview: BookingExpertListItem | undefined = route.params?.preview;
  /** Thème touché dans la liste : le carrousel s'y rend et le met en avant. */
  const focusOfferId: number | undefined = route.params?.focusOfferId;
  /** Ouvert depuis la liste Consultation : ni carte Consultation ni thèmes (la carte de la liste suffit). */
  const consultationMode = route.params?.purpose === 'consultation';

  // Médias OrthoMaster de l'expert (5 au plus) : centres d'intérêt de l'utilisateur d'abord.
  const { data: medias } = useQuery({
    queryKey: ['booking', 'expert-medias', expertId],
    queryFn: () => getBookingExpertMedias(expertId, 5),
    staleTime: 5 * 60 * 1000,
  });
  const openMedia = (media: BookingExpertMedia) =>
    navigation.navigate('media', { screen: 'flash-media-preview', params: { media } });

  const { data, isLoading } = useQuery({
    queryKey: ['booking', 'expert', expertId],
    queryFn: () => getBookingExpert(expertId),
  });

  // En-tête immédiat grâce à l'aperçu de la liste ; la fiche complète le remplace à l'arrivée.
  const expert = data?.expert ?? preview;
  const offers = data?.offers ?? [];
  const online = (data ? data.expert.online !== false : preview?.online) ?? false;
  // Consultation sur mesure (v3) : proposée en plus (ou à la place) des thèmes.
  const consultation = data ? data.consultation ?? null : preview?.consultation ?? null;
  const theme = expertTheme(expert?.palette, expert?.palette_color);

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

  // Toute sortie (croix, fond, glissement, retour Android) passe par ici : la feuille redescend d'abord.
  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (closing.current) return;
      e.preventDefault();
      closing.current = true;
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
    inputRange: [0, offscreen],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  /* ---- Thème : détails et calendrier sur le même écran ---- */

  const openOffer = (offer: BookingOffer) =>
    navigation.navigate('expert-offer', {
      expertId,
      offer,
      expert: {
        name: expert?.name,
        honorific: expert?.honorific,
        avatar_url: expert?.avatar_url,
        palette: expert?.palette,
        palette_color: expert?.palette_color,
      },
    });

  return (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Fermer le profil" />
      </Animated.View>

      <Animated.View
        style={
          IS_WEB
            ? [styles.panel, { width: panelWidth, transform: [{ translateX: translateY }] }]
            : [styles.sheet, { height: sheetHeight, transform: [{ translateY }] }]
        }
      >
        {/* Fond séparé et rogné aux arrondis : l'avatar, lui, dépasse au-dessus (mobile). */}
        <View style={[StyleSheet.absoluteFill, IS_WEB ? styles.panelBackground : styles.sheetBackground]}>
          <ThemeBackdrop theme={theme} />
        </View>

        {/* ---- En-tête fixe : poignée (mobile), avatar à gauche, identité à droite, fermeture ---- */}
        <View {...(IS_WEB ? {} : pan.panHandlers)} style={IS_WEB ? styles.grabWeb : styles.grab}>
          {!IS_WEB && <View style={[styles.handle, { backgroundColor: theme.line }]} />}

          <View style={styles.headerRow}>
            {expert && (
              <View style={[styles.avatar, { backgroundColor: theme.bg, borderColor: theme.primary }]}>
                <View style={[styles.photo, { backgroundColor: theme.card }]}>
                  {expert.avatar_url ? (
                    <Image source={{ uri: expert.avatar_url }} style={StyleSheet.absoluteFill} />
                  ) : (
                    <Text style={[styles.photoInitials, { color: theme.primary }]}>{initials(expert.name)}</Text>
                  )}
                </View>
                {online && <View style={[styles.avatarDot, { borderColor: theme.bg }]} />}
              </View>
            )}

            {expert && (
              <View style={styles.identity}>
                {expert.honorific ? (
                  <Text style={[styles.honorific, { color: theme.primary }]}>{expert.honorific}</Text>
                ) : null}
                {nameLines(expert.name).map((line, i) => (
                  <Text key={i} style={[styles.name, { color: theme.ink }]}>
                    {line}
                  </Text>
                ))}
                {expert.credentials ? (
                  <Text style={[styles.credentials, { color: theme.muted }]}>{expert.credentials}</Text>
                ) : null}
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.close,
                { borderColor: withAlpha(theme.primary, 0.45), backgroundColor: withAlpha(theme.primary, 0.1) },
              ]}
              onPress={close}
              hitSlop={8}
              accessibilityLabel="Fermer"
            >
              <Ionicons name="close" size={26} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Simple filet : limite entre l'en-tête fixe et le contenu défilant. */}
        <View style={[styles.rule, { backgroundColor: theme.line }]} />

        <ScrollView
          contentContainerStyle={{ paddingTop: Spacings.lg, paddingBottom: Math.max(insets.bottom, Spacings.md) + Spacings.lg }}
          showsVerticalScrollIndicator={false}
        >
          {/* ---- Domaines ---- */}
          {data && data.expert.domains.length > 0 && (
            <View style={styles.domains}>
              {data.expert.domains.map((domain) => (
                <View
                  key={domain.id}
                  style={[
                    styles.domainPill,
                    { borderColor: withAlpha(theme.primary, 0.45), backgroundColor: withAlpha(theme.primary, 0.09) },
                  ]}
                >
                  <Text style={[styles.domainText, { color: theme.primary }]}>{domain.name}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ---- Présentation ---- */}
          {expert?.lede ? (
            <View style={styles.ledeBlock}>
              <Lede text={expert.lede} theme={theme} />
            </View>
          ) : null}

          {/* ---- Consultation sur mesure (pas depuis la liste Consultation) ---- */}
          {!consultationMode && online && consultation ? (
            <TouchableOpacity
              style={[styles.consultCard, { borderColor: withAlpha(CONSULT_COLOR, 0.3) }]}
              onPress={() => navigation.navigate('consultation-request', { expertId, preview: expert })}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Demander une consultation sur mesure"
            >
              <View style={styles.consultIcon}>
                <Ionicons name="chatbubbles-outline" size={22} color={CONSULT_COLOR} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.consultTitle}>Consultation sur mesure</Text>
                <Text style={styles.consultText}>
                  Votre sujet, en visio · {priceLabel(consultation.price_30, consultation.currency)} les 30 minutes
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={CONSULT_COLOR} />
            </TouchableOpacity>
          ) : null}

          {/* ---- Thèmes (pas depuis la liste Consultation) ---- */}
          {!consultationMode && !(online && consultation && offers.length === 0 && !isLoading) ? (
          <Text style={[styles.sectionTitle, { color: theme.ink }]}>
            {offers.length > 1 ? "Thèmes de l'échange" : "Thème de l'échange"}
          </Text>
          ) : null}

          {consultationMode || (online && consultation && offers.length === 0 && !isLoading) ? null : isLoading ? (
            <ActivityIndicator color={theme.primary} style={styles.loading} />
          ) : !online || offers.length === 0 ? (
            <View
              style={[
                styles.offline,
                { backgroundColor: withAlpha(theme.primary, 0.08), borderColor: withAlpha(theme.primary, 0.24) },
              ]}
            >
              <Ionicons name="moon-outline" size={20} color={theme.muted} />
              <Text style={[styles.offlineText, { color: theme.muted }]}>
                Cet expert ne prend pas de rendez-vous pour le moment.
              </Text>
            </View>
          ) : (
            <>
              <OfferCarousel
                offers={offers}
                accent={theme.primary}
                width={contentWidth}
                inset={INSET}
                notchColor={theme.bg}
                focusOfferId={focusOfferId}
                // Après l'ouverture de la feuille / du panneau (340 ms) : le défilement se voit.
                focusDelay={420}
                onSelect={openOffer}
              />
              <Text style={[styles.tapHint, { color: theme.muted }]}>
                Touchez un thème pour le découvrir et choisir vos demi-journées.
              </Text>
            </>
          )}

          {/* ---- Médias OrthoMaster de l'expert ---- */}
          {medias && medias.length > 0 ? (
            <>
              <Text style={[styles.sectionTitle, { color: theme.ink }]}>Ses médias</Text>
              {medias.some((m) => m.matches_interests) ? (
                <Text style={[styles.mediaHint, { color: theme.muted }]}>Selon vos centres d'intérêt, puis les plus récents.</Text>
              ) : null}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.medias}
              >
                {medias.map((m) => (
                  <TouchableOpacity
                    key={m.id_content}
                    style={[styles.media, { backgroundColor: theme.card, borderColor: theme.line }]}
                    onPress={() => openMedia(m)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={m.title}
                  >
                    <View style={[styles.mediaThumb, { backgroundColor: withAlpha(theme.primary, 0.12) }]}>
                      {m.thumbnail ? (
                        <Image source={{ uri: m.thumbnail }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                      ) : (
                        <Ionicons name="play-circle-outline" size={34} color={theme.primary} />
                      )}
                      {m.duration ? (
                        <View style={styles.mediaDuration}>
                          <Text style={styles.mediaDurationText}>{m.duration}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.mediaTitle, { color: theme.ink }]} numberOfLines={2}>
                      {m.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          ) : null}
        </ScrollView>

      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  consultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    marginHorizontal: INSET,
    marginTop: Spacings.lg,
    padding: Spacings.md,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: CONSULT_SOFT,
  },
  consultIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consultTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: CONSULT_COLOR_DARK,
  },
  consultText: {
    fontFamily: 'Roboto',
    fontSize: 13,
    lineHeight: 18,
    color: CONSULT_COLOR_DARK,
  },
  /* ---- Structure ---- */
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
  },
  // Web : panneau à droite, toute la hauteur, arrondi côté page.
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: WEB_PANEL_RADIUS,
    borderBottomLeftRadius: WEB_PANEL_RADIUS,
    shadowColor: '#000',
    shadowOffset: { width: -8, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
  },
  panelBackground: {
    borderTopLeftRadius: WEB_PANEL_RADIUS,
    borderBottomLeftRadius: WEB_PANEL_RADIUS,
    overflow: 'hidden',
  },
  grabWeb: {
    paddingTop: Spacings.lg,
  },
  sheetBackground: {
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
    overflow: 'hidden',
  },

  /* ---- Zone de prise ---- */
  grab: {
    paddingBottom: Spacings.xxs,
  },
  // Avatar à gauche, identité à droite, fermeture au bout de la ligne.
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.md,
    paddingHorizontal: INSET,
    paddingTop: Spacings.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    marginTop: Spacings.xs,
    borderRadius: 2,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: AVATAR_RING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInitials: {
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
  },
  avatarDot: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    backgroundColor: Colors.success,
  },
  close: {
    alignSelf: 'flex-start',
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ---- Identité (h1 .dr, h1 .ln, .role, .lede) ---- */
  identity: {
    flex: 1,
    minWidth: 0,
  },
  rule: {
    height: StyleSheet.hairlineWidth * 2,
    marginHorizontal: INSET,
    marginTop: Spacings.md,
  },
  ledeBlock: {
    paddingHorizontal: INSET,
  },
  honorific: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    letterSpacing: -0.1,
  },
  // Poppins a de hauts jambages : interligne ≥ 1,2 × la taille, sinon les lettres sont rognées.
  name: {
    fontFamily: 'Poppins-Bold',
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.8,
  },
  credentials: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    lineHeight: 19,
    marginTop: 2,
  },
  lede: {
    fontFamily: 'Roboto',
    fontSize: 16,
    lineHeight: 26,
    marginTop: Spacings.md,
  },
  // Copie de mesure : même largeur et même style, invisible et hors du flux.
  measure: {
    position: 'absolute',
    left: 0,
    right: 0,
    opacity: 0,
  },
  more: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    marginTop: Spacings.xxs,
  },

  /* ---- Domaines (.expertise li) ---- */
  domains: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.xs,
    paddingHorizontal: INSET,
  },
  domainPill: {
    maxWidth: '100%',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  domainText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    lineHeight: 17,
  },

  /* ---- Médias ---- */
  mediaHint: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    paddingHorizontal: INSET,
    marginTop: -Spacings.sm,
    marginBottom: Spacings.sm,
  },
  medias: {
    gap: Spacings.sm,
    paddingHorizontal: INSET,
  },
  media: {
    width: 210,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mediaThumb: {
    width: '100%',
    aspectRatio: 16 / 9,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mediaDuration: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  mediaDurationText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    color: Colors.white,
  },
  mediaTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    lineHeight: 18,
    padding: Spacings.sm,
  },

  /* ---- Thèmes (h2) ---- */
  sectionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.6,
    paddingHorizontal: INSET,
    marginTop: Spacings.xxl,
    marginBottom: Spacings.md,
  },
  loading: {
    marginVertical: Spacings.xl,
  },
  tapHint: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    textAlign: 'center',
    marginTop: Spacings.sm,
    paddingHorizontal: INSET,
  },
  // Repris de .joinbox : teinte de la couleur principale, liseré à 24 %.
  offline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    marginHorizontal: INSET,
    padding: Spacings.lg,
    borderRadius: 24,
    borderWidth: 1,
  },
  offlineText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
});