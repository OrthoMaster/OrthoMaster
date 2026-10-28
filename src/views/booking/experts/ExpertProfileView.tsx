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
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import { BookingExpertListItem, BookingOffer, getBookingExpert } from '../../../services/v2/BookingService';
import { initials } from '../bookingFormat';
import { withAlpha } from '../bookingPalette';
import { ExpertTheme, expertTheme } from '../expertTheme';
import { ThemeBackdrop } from '../components/ThemeBackdrop';
import { SwooshRule } from '../components/SwooshRule';
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
const PHOTO_SIZE = 104;
const AVATAR_GAP = 6;
const AVATAR_RING = 1.5;
const AVATAR_SIZE = PHOTO_SIZE + (AVATAR_GAP + AVATAR_RING) * 2;

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
 * Habillage repris de sa page vitrine web : fond à halo radial, couleurs et typographie
 * du thème de sa palette. Thèmes en carrousel : la carte affichée est celle réservée.
 */
export const ExpertProfileView = ({ navigation, route }) => {
  useHideFloatingTabBar(navigation);

  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const sheetHeight = Math.round(height * SHEET_RATIO);

  const expertId: number = route.params?.expertId;
  const preview: BookingExpertListItem | undefined = route.params?.preview;

  const { data, isLoading } = useQuery({
    queryKey: ['booking', 'expert', expertId],
    queryFn: () => getBookingExpert(expertId),
  });

  // En-tête immédiat grâce à l'aperçu de la liste ; la fiche complète le remplace à l'arrivée.
  const expert = data?.expert ?? preview;
  const offers = data?.offers ?? [];
  const online = (data ? data.expert.online !== false : preview?.online) ?? false;
  const theme = expertTheme(expert?.palette, expert?.palette_color);

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

  // Toute sortie (croix, fond, glissement, retour Android) passe par ici : la feuille redescend d'abord.
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

      <Animated.View style={[styles.sheet, { height: sheetHeight, transform: [{ translateY }] }]}>
        {/* Fond séparé et rogné aux arrondis : l'avatar, lui, dépasse au-dessus. */}
        <View style={[StyleSheet.absoluteFill, styles.sheetBackground]}>
          <ThemeBackdrop theme={theme} />
        </View>

        {/* ---- Zone de prise : poignée, avatar, fermeture ---- */}
        <View {...pan.panHandlers} style={styles.grab}>
          <View style={[styles.handle, { backgroundColor: theme.line }]} />

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

        {/* ---- Identité : fixe, seul le contenu en dessous défile ---- */}
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
              <Text style={[styles.credentials, { color: theme.ink }]}>{expert.credentials}</Text>
            ) : null}
          </View>
        )}

        {/* Filet de la couleur principale : limite entre l'en-tête fixe et le contenu défilant. */}
        <SwooshRule color={theme.primary} width={width - INSET * 2} style={styles.rule} />

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

          {/* ---- Thèmes ---- */}
          <Text style={[styles.sectionTitle, { color: theme.ink }]}>
            {offers.length > 1 ? "Thèmes de l'échange" : "Thème de l'échange"}
          </Text>

          {isLoading ? (
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
                width={width}
                inset={INSET}
                notchColor={theme.bg}
                onSelect={openOffer}
              />
              <Text style={[styles.tapHint, { color: theme.muted }]}>
                Touchez un thème pour le découvrir et choisir vos demi-journées.
              </Text>
            </>
          )}
        </ScrollView>

      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  sheetBackground: {
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
    overflow: 'hidden',
  },

  /* ---- Zone de prise ---- */
  grab: {
    height: AVATAR_SIZE / 2 + Spacings.md,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    marginTop: Spacings.xs,
    borderRadius: 2,
  },
  // Moitié de l'avatar au-dessus du bord de la feuille.
  avatar: {
    position: 'absolute',
    top: -AVATAR_SIZE / 2,
    left: INSET,
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
    fontSize: 34,
  },
  avatarDot: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    backgroundColor: Colors.success,
  },
  close: {
    position: 'absolute',
    top: Spacings.md,
    right: INSET,
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ---- Identité (h1 .dr, h1 .ln, .role, .lede) ---- */
  identity: {
    paddingHorizontal: INSET,
  },
  rule: {
    marginLeft: INSET,
    marginTop: Spacings.md,
  },
  ledeBlock: {
    paddingHorizontal: INSET,
  },
  honorific: {
    fontFamily: 'Poppins-Regular',
    fontSize: 17,
    letterSpacing: -0.2,
    marginBottom: Spacings.xxs,
  },
  // Poppins a de hauts jambages : interligne ≥ 1,2 × la taille, sinon les lettres sont rognées.
  name: {
    fontFamily: 'Poppins-Bold',
    fontSize: 40,
    lineHeight: 50,
    letterSpacing: -1.4,
  },
  credentials: {
    fontFamily: 'Poppins-Regular',
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0.2,
    marginTop: Spacings.md,
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