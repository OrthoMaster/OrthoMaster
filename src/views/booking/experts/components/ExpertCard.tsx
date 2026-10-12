import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, TouchableOpacity, Animated, StyleSheet } from 'react-native';

import Colors from '../../../../../constants/Colors';
import Spacings from '../../../../../constants/Spacings';

import { BookingExpertListItem } from '../../../../services/v2/BookingService';
import { ExpertAvatar } from '../../components/ExpertAvatar';

const RADIUS = 18;
const PADDING = Spacings.md;
const AVATAR_SIZE = 64;
const AVATAR_RING = 1.5;
const DOT_SIZE = 14;
const BUTTON_HEIGHT = 36;

/**
 * Hauteurs réservées : le nom et les références se suivent sans écart, dans un bloc
 * de hauteur fixe (2 lignes max chacun) ; l'espace libre reste sous le texte, et toutes
 * les cartes d'une rangée gardent la même hauteur.
 */
const HONORIFIC_HEIGHT = 16;
const NAME_LINE = 22;
const NAME_LINES = 2;
const CREDENTIALS_LINE = 18;
const CREDENTIALS_LINES = 2;
const TEXT_BLOCK_HEIGHT = NAME_LINE * NAME_LINES + CREDENTIALS_LINE * CREDENTIALS_LINES;

export const EXPERT_CARD_HEIGHT =
  PADDING +
  AVATAR_SIZE +
  Spacings.sm +
  HONORIFIC_HEIGHT +
  TEXT_BLOCK_HEIGHT +
  Spacings.sm +
  BUTTON_HEIGHT +
  PADDING;

/** Décalage d'entrée entre deux cartes d'une même page : la liste se déroule au lieu d'apparaître d'un bloc. */
const STAGGER_MS = 60;

/** Couleur de l'expert sans palette : celle de l'espace rendez-vous. */
const DEFAULT_ACCENT = Colors.lblueDark;

/** #RRGGBB + opacité (0–1) en #RRGGBBAA. */
const withAlpha = (hex: string, alpha: number) =>
  `${hex}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;

/**
 * Teinte opaque très claire : la couleur mélangée au blanc. Opaque plutôt que transparente,
 * pour que le fond de l'écran ne transparaisse pas sous la carte.
 */
const tint = (hex: string, amount: number) => {
  const channel = (i: number) => {
    const value = parseInt(hex.slice(i, i + 2), 16);
    return Math.round(255 - (255 - value) * amount).toString(16).padStart(2, '0');
  };
  return `#${channel(1)}${channel(3)}${channel(5)}`;
};

/** Point vert sur l'avatar, avec une pulsation discrète. */
const OnlineDot = () => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1600, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={styles.dotWrap} pointerEvents="none">
      <Animated.View
        style={[
          styles.dotRing,
          {
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }],
          },
        ]}
      />
      <View style={styles.dot} />
    </View>
  );
};

interface ExpertCardProps {
  expert: BookingExpertListItem;
  /** Largeur calculée par la liste : deux cartes par rangée. */
  width: number;
  /** Rang dans sa page (0–9), pour l'entrée en cascade. */
  indexInPage: number;
  /** Carte et bouton Profil. */
  onPress: () => void;
  /** Bouton Réserver ; inactif si l'expert ne prend pas de rendez-vous. */
  onBook: () => void;
}

/**
 * Carte au fond très légèrement teinté de la palette, ombre de la même couleur.
 * Avatar puis identité alignés à gauche, pastille « Disponible » en haut à droite,
 * actions Profil / Réserver en pied.
 */
export const ExpertCard: React.FC<ExpertCardProps> = ({ expert, width, indexInPage, onPress, onBook }) => {
  const accent = expert.palette_color ?? DEFAULT_ACCENT;

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

  const animatePress = (toValue: number) => {
    Animated.spring(press, { toValue, friction: 7, tension: 200, useNativeDriver: true }).start();
  };

  const animated = {
    opacity: enter,
    transform: [
      { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
      // Entrée puis appui : les deux échelles se multiplient.
      { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
      { scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] }) },
    ],
  };

  return (
    <Animated.View style={[{ width }, animated]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => animatePress(1)}
        onPressOut={() => animatePress(0)}
        accessibilityRole="button"
        accessibilityLabel={[expert.honorific, expert.name, expert.online ? 'disponible' : null]
          .filter(Boolean)
          .join(', ')}
        style={[
          styles.card,
          { backgroundColor: tint(accent, 0.05), shadowColor: accent, borderColor: withAlpha(accent, 0.14) },
        ]}
      >
        <View style={styles.avatarWrap}>
          <ExpertAvatar
            uri={expert.avatar_url}
            name={expert.name}
            size={AVATAR_SIZE}
            ringColor={accent}
            ringWidth={AVATAR_RING}
            fillColor={tint(accent, 0.12)}
            initialsColor={accent}
          />
          {expert.online && <OnlineDot />}
        </View>

        {expert.online && (
          <View style={styles.pill} pointerEvents="none">
            <Text style={styles.pillText}>Disponible</Text>
          </View>
        )}

        <Text style={[styles.honorific, { color: accent }]} numberOfLines={1}>
          {expert.honorific ?? ''}
        </Text>

        <View style={styles.textBlock}>
          <Text style={styles.name} numberOfLines={NAME_LINES}>
            {expert.name}
          </Text>
          {expert.credentials ? (
            <Text style={styles.credentials} numberOfLines={CREDENTIALS_LINES}>
              {expert.credentials}
            </Text>
          ) : null}
        </View>

        {/* ---- Actions ---- */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.buttonOutline, { borderColor: accent }]}
            onPress={onPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Profil de ${expert.name}`}
          >
            <Text style={[styles.buttonText, { color: accent }]} numberOfLines={1}>
              Profil
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: expert.online ? accent : Colors.disabledBackground }]}
            onPress={onBook}
            disabled={!expert.online}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Réserver avec ${expert.name}`}
            accessibilityState={{ disabled: !expert.online }}
          >
            <Text style={[styles.buttonText, { color: Colors.white }]} numberOfLines={1}>
              Réserver
            </Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  /* ---- Carte ---- */
  card: {
    height: EXPERT_CARD_HEIGHT,
    padding: PADDING,
    borderRadius: RADIUS,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 5,
  },

  /* ---- Avatar et statut ---- */
  avatarWrap: {
    alignSelf: 'flex-start',
    marginBottom: Spacings.sm,
  },
  dotWrap: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: DOT_SIZE,
    height: DOT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 2.5,
    borderColor: Colors.white,
    backgroundColor: Colors.success,
  },
  dotRing: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: Colors.success,
  },
  pill: {
    position: 'absolute',
    top: PADDING,
    right: PADDING - Spacings.xxs,
    paddingHorizontal: Spacings.xs,
    paddingVertical: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  pillText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 10,
    color: Colors.success,
  },

  /* ---- Texte ---- */
  honorific: {
    height: HONORIFIC_HEIGHT,
    lineHeight: HONORIFIC_HEIGHT,
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  textBlock: {
    height: TEXT_BLOCK_HEIGHT,
  },
  name: {
    fontFamily: 'Poppins-Bold',
    fontSize: 17,
    lineHeight: NAME_LINE,
    color: Colors.text,
  },
  credentials: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    lineHeight: CREDENTIALS_LINE,
    color: Colors.subtext2,
  },

  /* ---- Actions ---- */
  actions: {
    flexDirection: 'row',
    gap: Spacings.xs,
    marginTop: Spacings.sm,
  },
  button: {
    flex: 1,
    height: BUTTON_HEIGHT,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOutline: {
    borderWidth: 1.5,
    backgroundColor: Colors.white,
  },
  buttonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
  },
});