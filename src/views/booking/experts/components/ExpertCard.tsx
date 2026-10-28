import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, Pressable, Animated, StyleSheet, LayoutChangeEvent } from 'react-native';

import Colors from '../../../../../constants/Colors';
import Spacings from '../../../../../constants/Spacings';

import { BookingExpertListItem } from '../../../../services/v2/BookingService';
import { initials } from '../../bookingFormat';

const CARD_RADIUS = 20;
const CARD_PADDING = Spacings.sm;
const PHOTO_RADIUS = 14;

/** Le portrait carré suit la hauteur du texte, dans ces bornes. */
const PHOTO_MIN = 92;
const PHOTO_MAX = 132;

/** Décalage d'entrée entre deux cartes d'une même page : la liste se déroule au lieu d'apparaître d'un bloc. */
const STAGGER_MS = 60;

interface ExpertCardProps {
  expert: BookingExpertListItem;
  width: number;
  /** Rang dans sa page (0–9), pour l'entrée en cascade. */
  indexInPage: number;
  onPress: () => void;
}

/**
 * Carte blanche aux couleurs de l'espace rendez-vous (la palette de l'expert est réservée
 * à son profil). Portrait carré à la hauteur du texte, identité à droite.
 */
export const ExpertCard: React.FC<ExpertCardProps> = ({ expert, width, indexInPage, onPress }) => {
  const [photoSize, setPhotoSize] = useState(PHOTO_MIN);

  const enter = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1,
      delay: indexInPage * STAGGER_MS,
      friction: 8,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, []);

  // Le carré prend la hauteur du bloc texte ; on ignore les écarts de quelques points
  // pour ne pas boucler (le texte se réagence quand le carré change de largeur).
  const fitPhoto = (e: LayoutChangeEvent) => {
    const next = Math.round(Math.min(PHOTO_MAX, Math.max(PHOTO_MIN, e.nativeEvent.layout.height)));
    if (Math.abs(next - photoSize) > 4) setPhotoSize(next);
  };

  const animatePress = (toValue: number) => {
    Animated.spring(press, { toValue, friction: 7, tension: 200, useNativeDriver: true }).start();
  };

  const animated = {
    opacity: enter,
    transform: [
      { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
      { scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] }) },
    ],
  };

  return (
    <Animated.View style={[{ width }, animated]}>
      <Pressable
        style={styles.card}
        onPress={onPress}
        onPressIn={() => animatePress(1)}
        onPressOut={() => animatePress(0)}
        accessibilityRole="button"
        accessibilityLabel={[expert.honorific, expert.name, expert.online ? 'disponible' : 'indisponible']
          .filter(Boolean)
          .join(', ')}
      >
        <View style={[styles.photo, { width: photoSize, height: photoSize }]}>
          {expert.avatar_url ? (
            <Image source={{ uri: expert.avatar_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <Text style={[styles.initials, { fontSize: Math.round(photoSize * 0.3) }]}>
              {initials(expert.name)}
            </Text>
          )}
        </View>

        <View style={styles.info} onLayout={fitPhoto}>
          {expert.honorific ? (
            <Text style={styles.honorific} numberOfLines={1}>
              {expert.honorific}
            </Text>
          ) : null}

          <Text style={styles.name} numberOfLines={2}>
            {expert.name}
          </Text>

          {expert.credentials ? (
            <Text style={styles.credentials} numberOfLines={2}>
              {expert.credentials}
            </Text>
          ) : null}
        </View>

        {/* Badge d'état, accroché au coin supérieur droit de la carte ; même forme pour les deux états. */}
        <View
          style={[styles.badge, { backgroundColor: expert.online ? Colors.successBackground : Colors.grayLight }]}
          pointerEvents="none"
        >
          <View style={[styles.badgeDot, { backgroundColor: expert.online ? Colors.success : Colors.gray }]} />
          <Text style={[styles.badgeText, { color: expert.online ? Colors.success : Colors.gray }]}>
            {expert.online ? 'Disponible' : 'Indisponible'}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  /* ---- Carte ---- */
  // Texte aligné en haut, sur le haut du portrait.
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.md,
    padding: CARD_PADDING,
    borderRadius: CARD_RADIUS,
    backgroundColor: Colors.white,
    shadowColor: Colors.lblueDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 5,
  },

  /* ---- Portrait ---- */
  // Sans photo : fond bleu de l'espace, initiales blanches.
  photo: {
    backgroundColor: Colors.lblue,
    borderRadius: PHOTO_RADIUS,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: 'Poppins-Bold',
    letterSpacing: 1,
    color: Colors.white,
  },

  /* ---- Identité ---- */
  // Marge haute : la première ligne passe sous le badge sans le toucher.
  info: {
    flex: 1,
    alignItems: 'flex-start',
    paddingTop: Spacings.lg,
  },
  // Coin supérieur droit, épousant l'arrondi de la carte.
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xxs,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.xxs,
    borderTopRightRadius: CARD_RADIUS,
    borderBottomLeftRadius: 12,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
  },
  honorific: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.lblueDark,
  },
  name: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    lineHeight: 23,
    letterSpacing: -0.3,
    color: Colors.text,
  },
  credentials: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.subtext2,
  },
});