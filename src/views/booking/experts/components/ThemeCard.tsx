import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Pressable, Animated, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import Colors from '../../../../../constants/Colors';
import Spacings from '../../../../../constants/Spacings';

import { BookingTheme } from '../../../../services/v2/BookingService';
import { initials, priceLabel } from '../../bookingFormat';
import { ModePill, sortModes } from '../../components/ModePill';
import { SearchReason } from './SearchReason';

const IS_WEB = Platform.OS === 'web';
const CARD_RADIUS = 20;
/** Hauteur de l'illustration, en part de la largeur de la carte. */
const IMAGE_HEIGHT_RATIO = 0.42;
const STAGGER_MS = 60;

interface ThemeCardProps {
  theme: BookingTheme;
  width: number;
  /** Rang dans sa page (0–9), pour l'entrée en cascade. */
  indexInPage: number;
  /** Ouverture en cours (fiche de l'expert chargée avant d'afficher le thème). */
  opening?: boolean;
  onPress: () => void;
}

/**
 * Carte « Thèmes » (mobile et web) : le thème est l'élément principal (image, titre,
 * description, formats et prix), l'expert n'apparaît qu'en pied de carte.
 */
export const ThemeCard: React.FC<ThemeCardProps> = ({ theme, width, indexInPage, opening = false, onPress }) => {
  const enter = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1,
      delay: indexInPage * STAGGER_MS,
      friction: 8,
      tension: 60,
      useNativeDriver: !IS_WEB,
    }).start();
  }, []);

  const animatePress = (toValue: number) =>
    Animated.timing(press, { toValue, duration: 100, useNativeDriver: !IS_WEB }).start();

  const animated = {
    opacity: enter,
    transform: [
      { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
      { scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.98] }) },
    ],
  };

  const formats =
    theme.formats ?? sortModes(theme.modes).map((mode) => ({ mode, price: theme.price_from as number, places: [] }));
  const expert = theme.expert;
  const expertName = [expert.honorific_short, expert.name].filter(Boolean).join(' ');

  return (
    <Animated.View style={[{ width }, animated as any]}>
      <Pressable
        style={styles.card}
        onPress={onPress}
        onPressIn={() => animatePress(1)}
        onPressOut={() => animatePress(0)}
        disabled={opening}
        accessibilityRole="button"
        accessibilityLabel={`${theme.title}, ${expertName}`}
      >
        {/* ---- Illustration, ou bandeau coloré sans image ---- */}
        {theme.image ? (
          <Image source={{ uri: theme.image.url }} style={[styles.image, { height: Math.round(width * IMAGE_HEIGHT_RATIO) }]} resizeMode="cover" />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: expert.palette_color ? `${expert.palette_color}22` : Colors.lblue3 }]}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={30} color={expert.palette_color ?? Colors.lblueDark} />
          </View>
        )}

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {theme.title}
            </Text>
            <Text style={styles.duration}>{theme.duration_label}</Text>
          </View>

          {theme.description ? (
            <Text style={styles.description} numberOfLines={3}>
              {theme.description}
            </Text>
          ) : null}

          {theme.reason ? <SearchReason text={theme.reason} /> : null}

          {/* ---- Formats : une ligne chacun, avec le prix ---- */}
          <View style={styles.formats}>
            {formats.map((format) => {
              const cities = format.places.map((p) => p.city).filter(Boolean);
              return (
                <View key={format.mode} style={styles.formatRow}>
                  <ModePill mode={format.mode} size="compact" />
                  {cities.length > 0 ? (
                    <Text style={styles.formatCities} numberOfLines={1}>
                      {cities.join(', ')}
                    </Text>
                  ) : (
                    <View style={styles.flex} />
                  )}
                  <Text style={styles.formatPrice}>{priceLabel(format.price, theme.currency)}</Text>
                </View>
              );
            })}
          </View>

          {/* ---- Expert, en second ---- */}
          <View style={styles.expertRow}>
            <View style={[styles.avatar, { backgroundColor: expert.palette_color ?? Colors.lblue }]}>
              {expert.avatar_url ? (
                <Image source={{ uri: expert.avatar_url }} style={StyleSheet.absoluteFill} />
              ) : (
                <Text style={styles.avatarText}>{initials(expert.name)}</Text>
              )}
            </View>
            <View style={styles.flex}>
              <Text style={styles.expertName} numberOfLines={1}>
                {expertName}
              </Text>
              {expert.credentials ? (
                <Text style={styles.expertCredentials} numberOfLines={1}>
                  {expert.credentials}
                </Text>
              ) : null}
            </View>
            {opening ? (
              <ActivityIndicator size="small" color={Colors.lblue} />
            ) : (
              <Ionicons name="chevron-forward" size={18} color={Colors.subtext} />
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  card: {
    borderRadius: CARD_RADIUS,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  image: {
    width: '100%',
    backgroundColor: Colors.grayLight,
  },
  imagePlaceholder: {
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: Spacings.md,
    gap: Spacings.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.sm,
  },
  title: {
    flex: 1,
    fontFamily: 'Poppins-Bold',
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: -0.2,
    color: Colors.text,
  },
  duration: {
    marginTop: 2,
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: Colors.lblueDark,
  },
  description: {
    fontFamily: 'Roboto',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.subtext2,
  },
  formats: {
    gap: 6,
    marginTop: Spacings.xxs,
  },
  formatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  formatCities: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.subtext2,
  },
  formatPrice: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: Colors.text,
  },
  expertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    marginTop: Spacings.xs,
    paddingTop: Spacings.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: Colors.white,
  },
  expertName: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: Colors.text,
  },
  expertCredentials: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: Colors.subtext,
  },
});
