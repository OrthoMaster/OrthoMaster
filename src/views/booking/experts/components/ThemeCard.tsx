import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Pressable, Animated, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import Colors from '../../../../../constants/Colors';
import Spacings from '../../../../../constants/Spacings';

import { BookingTheme } from '../../../../services/v2/BookingService';
import { initials, priceLabel } from '../../bookingFormat';
import { accentOf } from '../../bookingPalette';
import { sortModes } from '../../components/ModePill';
import { SearchReason } from './SearchReason';

const IS_WEB = Platform.OS === 'web';
const CARD_RADIUS = 18;
const STAGGER_MS = 60;

interface ThemeCardProps {
  theme: BookingTheme;
  width: number;
  /** Rang dans sa page (0–9), pour l'entrée en cascade. */
  indexInPage: number;
  /** Ouverture en cours (fiche de l'expert chargée avant d'afficher le thème). */
  opening?: boolean;
  /** Grille web : la carte prend la hauteur de sa rangée. */
  stretch?: boolean;
  onPress: () => void;
  onExpertPress: () => void;
}

/**
 * Carte « Thèmes » (mobile et web), sans image (les photos ne se voient que sur l'écran du thème) :
 * filet aux couleurs de l'expert, durée, titre, description sur deux lignes, formats en gris ;
 * en pied, l'expert (vers son profil) et le prix « dès ». Toucher la carte ouvre l'écran Réserver.
 */
export const ThemeCard: React.FC<ThemeCardProps> = ({ theme, width, indexInPage, opening = false, stretch, onPress, onExpertPress }) => {
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1,
      delay: indexInPage * STAGGER_MS,
      friction: 8,
      tension: 60,
      useNativeDriver: !IS_WEB,
    }).start();
  }, []);

  const animated: any = {
    opacity: enter,
    transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  };

  const expert = theme.expert;
  const accent = accentOf(expert.palette_color);
  const expertName = [expert.honorific_short, expert.name].filter(Boolean).join(' ');
  const formats =
    theme.formats ?? sortModes(theme.modes).map((mode) => ({ mode, price: theme.price_from as number, places: [] }));
  const online = formats.some((f) => f.mode === 'online');
  const cities = [...new Set(formats.flatMap((f) => (f.mode === 'onsite' ? f.places.map((p) => p.city) : [])).filter(Boolean))];
  const onsiteOnly = formats.some((f) => f.mode === 'onsite') && !cities.length;
  const prices = formats.map((f) => f.price).filter((p) => p != null);
  const from = prices.length ? Math.min(...prices) : theme.price_from;
  const several = new Set(prices).size > 1;

  return (
    <Animated.View style={[{ width }, stretch && styles.stretch, animated]}>
      <Pressable
        style={({ pressed }) => [styles.card, stretch && styles.stretch, pressed && styles.pressed]}
        onPress={onPress}
        disabled={opening}
        accessibilityRole="button"
        accessibilityLabel={`${theme.title}, ${expertName}`}
      >
        <View style={[styles.filet, { backgroundColor: accent }]} />

        <View style={styles.body}>
          <Text style={[styles.eyebrow, { color: accent }]} numberOfLines={1}>
            {theme.duration_label}
          </Text>
          <Text style={styles.title} numberOfLines={2}>
            {theme.title}
          </Text>
          {theme.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {theme.description}
            </Text>
          ) : null}
          {theme.reason ? <SearchReason text={theme.reason} /> : null}

          {/* Formats en une ligne grise, sans pastilles. */}
          <View style={styles.meta}>
            {online ? (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="video-outline" size={14} color={Colors.subtext} />
                <Text style={styles.metaText}>Visio</Text>
              </View>
            ) : null}
            {cities.length || onsiteOnly ? (
              <View style={[styles.metaItem, styles.shrink]}>
                <MaterialCommunityIcons name="map-marker-outline" size={14} color={Colors.subtext} />
                <Text style={[styles.metaText, styles.shrink]} numberOfLines={1}>
                  {cities.length ? cities.join(', ') : 'Présentiel'}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.spacer} />

          {/* ---- Pied : l'expert (vers son profil) et le prix ---- */}
          <View style={styles.foot}>
            <Pressable
              style={({ pressed }) => [styles.expert, pressed && styles.pressed]}
              onPress={onExpertPress}
              hitSlop={6}
              accessibilityRole="link"
              accessibilityLabel={`Profil de ${expertName}`}
            >
              <View style={[styles.avatar, { backgroundColor: accent }]}>
                {expert.avatar_url ? (
                  <Image source={{ uri: expert.avatar_url }} style={StyleSheet.absoluteFill} />
                ) : (
                  <Text style={styles.avatarText}>{initials(expert.name)}</Text>
                )}
              </View>
              <Text style={styles.expertName} numberOfLines={1}>
                {expertName}
              </Text>
            </Pressable>
            <Text style={styles.price}>
              {several ? <Text style={styles.priceFrom}>dès </Text> : null}
              {priceLabel(from, theme.currency)}
            </Text>
            {opening ? (
              <ActivityIndicator size="small" color={accent} />
            ) : (
              <Ionicons name="chevron-forward" size={18} color={accent} />
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  stretch: {
    flex: 1,
  },
  shrink: {
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.75,
  },
  card: {
    flexDirection: 'row',
    borderRadius: CARD_RADIUS,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  filet: {
    width: 5,
  },
  body: {
    flex: 1,
    padding: Spacings.md,
    gap: 4,
  },
  eyebrow: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.2,
    color: Colors.text,
  },
  description: {
    fontFamily: 'Roboto',
    fontSize: 13,
    lineHeight: 19,
    color: Colors.subtext2,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.subtext2,
  },
  spacer: {
    flexGrow: 1,
  },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    marginTop: Spacings.sm,
    paddingTop: Spacings.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  expert: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    minWidth: 0,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    color: Colors.white,
  },
  expertName: {
    flexShrink: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: Colors.text,
  },
  price: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: Colors.text,
  },
  priceFrom: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.subtext2,
  },
});
