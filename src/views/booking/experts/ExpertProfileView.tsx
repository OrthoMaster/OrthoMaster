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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
import { withAlpha } from '../bookingPalette';
import { ExpertTheme, expertTheme } from '../expertTheme';
import { ThemeBackdrop } from '../components/ThemeBackdrop';
import { useHideFloatingTabBar } from '../useHideFloatingTabBar';

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

/** Au-delà de quatre lignes, la présentation se replie derrière « Lire la suite ». */
const LEDE_LINES = 4;
/** Médias : 4, en grille de 2 × 2. */
const MEDIA_COUNT = 4;

/** Villes du présentiel d'une offre (ou de toutes les offres). */
const citiesOf = (offers: BookingOffer[]) => [
  ...new Set(
    offers.flatMap((o) => o.modes.filter((m) => m.mode === 'onsite').flatMap((m) => (m.locations ?? []).map((l) => l.city)))
  ),
].filter(Boolean) as string[];

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
 * du thème de sa palette. Tout défile à la verticale : thèmes en liste (toucher un thème ouvre
 * l'écran Réserver), médias en grille de 2 × 2. Ni Écrire ni Consultation ici.
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
  // Deux médias par rangée, dans les marges de la feuille.
  const mediaWidth = Math.floor((contentWidth - INSET * 2 - Spacings.sm) / 2);

  const expertId: number = route.params?.expertId;
  const preview: BookingExpertListItem | undefined = route.params?.preview;
  /** Ouvert depuis la liste Consultation : ni carte Consultation ni thèmes (la carte de la liste suffit). */
  const consultationMode = route.params?.purpose === 'consultation';

  // Médias OrthoMaster de l'expert (4 au plus) : centres d'intérêt de l'utilisateur d'abord.
  const { data: medias } = useQuery({
    queryKey: ['booking', 'expert-medias', expertId, MEDIA_COUNT],
    queryFn: () => getBookingExpertMedias(expertId, MEDIA_COUNT),
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
  const cities = citiesOf(offers);
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
      offerId: offer.id,
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
                {cities.length ? (
                  <View style={styles.cityRow}>
                    <Ionicons name="location-outline" size={14} color={theme.primary} />
                    <Text style={[styles.city, { color: theme.muted }]} numberOfLines={1}>
                      {cities.join(', ')}
                    </Text>
                  </View>
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

          {/* ---- Thèmes (pas depuis la liste Consultation) : liste verticale légère ---- */}
          {consultationMode || (!isLoading && online && offers.length === 0) ? null : (
            <>
              <Text style={[styles.sectionTitle, { color: theme.ink }]}>
                {offers.length > 1 ? `Thèmes (${offers.length})` : 'Thème'}
              </Text>
              {isLoading ? (
                <ActivityIndicator color={theme.primary} style={styles.loading} />
              ) : !online ? (
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
                <View style={[styles.offers, { backgroundColor: theme.card, borderColor: theme.line }]}>
                  {offers.map((offer, i) => {
                    const prices = offer.modes.map((m) => m.price);
                    const offerCities = citiesOf([offer]);
                    const meta = [
                      offer.duration_label,
                      offer.modes.some((m) => m.mode === 'online') ? 'Visio' : null,
                      offer.modes.some((m) => m.mode === 'onsite') ? offerCities.join(', ') || 'Présentiel' : null,
                    ].filter(Boolean);
                    return (
                      <Pressable
                        key={offer.id}
                        style={({ pressed }) => [
                          styles.offer,
                          i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line },
                          pressed && { backgroundColor: withAlpha(theme.primary, 0.06) },
                        ]}
                        onPress={() => openOffer(offer)}
                        accessibilityRole="button"
                        accessibilityLabel={`${offer.title}, réserver`}
                      >
                        <View style={styles.flex}>
                          <View style={styles.offerHead}>
                            <Text style={[styles.offerTitle, { color: theme.ink }]} numberOfLines={2}>
                              {offer.title}
                            </Text>
                            <Text style={[styles.offerPrice, { color: theme.ink }]}>
                              {new Set(prices).size > 1 ? <Text style={[styles.offerFrom, { color: theme.muted }]}>dès </Text> : null}
                              {priceLabel(offer.price, offer.currency)}
                            </Text>
                          </View>
                          <Text style={[styles.offerMeta, { color: theme.muted }]} numberOfLines={1}>
                            {meta.join(' · ')}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={theme.primary} />
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </>
          )}

          {/* ---- Médias OrthoMaster de l'expert : grille de 2 × 2 ---- */}
          {medias && medias.length > 0 ? (
            <>
              <Text style={[styles.sectionTitle, { color: theme.ink }]}>Ses médias</Text>
              {medias.some((m) => m.matches_interests) ? (
                <Text style={[styles.mediaHint, { color: theme.muted }]}>Selon vos centres d'intérêt, puis les plus récents.</Text>
              ) : null}
              <View style={styles.medias}>
                {medias.slice(0, MEDIA_COUNT).map((m) => (
                  <TouchableOpacity
                    key={m.id_content}
                    style={[styles.media, { width: mediaWidth, backgroundColor: theme.card, borderColor: theme.line }]}
                    onPress={() => openMedia(m)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={m.title}
                  >
                    <View style={[styles.mediaThumb, { backgroundColor: withAlpha(theme.primary, 0.12) }]}>
                      {m.thumbnail ? (
                        <Image source={{ uri: m.thumbnail }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                      ) : (
                        <MaterialCommunityIcons name="play-circle-outline" size={30} color={theme.primary} />
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
              </View>
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.sm,
    paddingHorizontal: INSET,
  },
  media: {
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
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.4,
    paddingHorizontal: INSET,
    marginTop: Spacings.xl,
    marginBottom: Spacings.sm,
  },
  loading: {
    marginVertical: Spacings.xl,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  city: {
    flexShrink: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
  },
  // Thèmes : un bloc, une ligne par thème, séparées d'un filet.
  offers: {
    marginHorizontal: INSET,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  offer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    paddingHorizontal: Spacings.md,
    paddingVertical: Spacings.sm + 2,
  },
  offerHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.sm,
  },
  offerTitle: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    lineHeight: 20,
  },
  offerPrice: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    lineHeight: 20,
  },
  offerFrom: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
  },
  offerMeta: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    marginTop: 2,
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