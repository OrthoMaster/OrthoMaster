import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, Pressable, Animated, ActivityIndicator, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../../constants/Colors';
import Spacings from '../../../../../constants/Spacings';

import { BookingExpertListItem } from '../../../../services/v2/BookingService';
import { initials, priceLabel } from '../../bookingFormat';
import { accentOf, tint, withAlpha } from '../../bookingPalette';
import { SearchReason } from './SearchReason';

const CARD_RADIUS = 20;
const CARD_PADDING = Spacings.sm;
const PHOTO_RADIUS = 14;
const PHOTO_MIN = 92;
const PHOTO_MAX = 132;
const STAGGER_MS = 60;
const ACTION_SIZE = 42;

interface ConsultationExpertCardProps {
  expert: BookingExpertListItem;
  width: number;
  /** Rang dans sa page (0–9), pour l'entrée en cascade. */
  indexInPage: number;
  /** Toucher la carte : profil de l'expert. */
  onPress: () => void;
  /** Bouton rond : écrire à l'expert. */
  onMessage: () => void;
  /** Bouton « Envoyer une demande » : demander une consultation. */
  onBook: () => void;
  /** Ouverture du fil en cours (bouton message en attente). */
  messaging?: boolean;
}

/**
 * Carte d'un expert dans la liste Consultation (mobile et web), aux couleurs choisies par
 * l'expert (palette ; à défaut, le bleu de l'espace) : pas de thèmes, tous ses domaines en
 * petites pastilles ; en bas, le prix de 30 minutes à gauche (sous le portrait) et deux
 * boutons à droite : écrire (rond) ou réserver une consultation (avec libellé).
 */
export const ConsultationExpertCard: React.FC<ConsultationExpertCardProps> = ({
  expert,
  width,
  indexInPage,
  onPress,
  onMessage,
  onBook,
  messaging,
}) => {
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

  const fitPhoto = (e: LayoutChangeEvent) => {
    const next = Math.round(Math.min(PHOTO_MAX, Math.max(PHOTO_MIN, e.nativeEvent.layout.height)));
    if (Math.abs(next - photoSize) > 4) setPhotoSize(next);
  };

  const animatePress = (toValue: number) => {
    Animated.spring(press, { toValue, friction: 7, tension: 200, useNativeDriver: true }).start();
  };

  const animated: any = {
    opacity: enter,
    transform: [
      { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
      { scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] }) },
    ],
  };

  const domains = expert.domains ?? [];
  const consult = expert.consultation;
  const accent = accentOf(expert.palette_color);
  const soft = tint(accent, 0.14);

  return (
    <Animated.View style={[{ width }, animated]}>
      <View style={[styles.card, { shadowColor: accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.16, shadowRadius: 14 }]}>
        <Pressable
          style={styles.main}
          onPress={onPress}
          onPressIn={() => animatePress(1)}
          onPressOut={() => animatePress(0)}
          accessibilityRole="button"
          accessibilityLabel={[expert.honorific, expert.name].filter(Boolean).join(' ')}
        >
          <View style={[styles.photo, { width: photoSize, height: photoSize, backgroundColor: accent }]}>
            {expert.avatar_url ? (
              <Image source={{ uri: expert.avatar_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <Text style={[styles.initials, { fontSize: Math.round(photoSize * 0.3) }]}>{initials(expert.name)}</Text>
            )}
          </View>

          <View style={styles.info} onLayout={fitPhoto}>
            {expert.honorific ? (
              <Text style={[styles.honorific, { color: accent }]} numberOfLines={1}>
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

            {domains.length > 0 ? (
              <View style={styles.domains}>
                {domains.map((d) => (
                  <View key={d.id} style={[styles.domain, { backgroundColor: soft }]}>
                    <Text style={[styles.domainText, { color: accent }]}>{d.name}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {expert.reason ? <SearchReason text={expert.reason} /> : null}
          </View>
        </Pressable>

        {/* ---- Prix (à gauche, sous le portrait) et actions aux couleurs de l'expert ---- */}
        <View style={[styles.actions, { backgroundColor: tint(accent, 0.08) }]}>
          <View style={styles.price}>
            {consult ? (
              <>
                <Text style={styles.priceValue}>{priceLabel(consult.price_30, consult.currency)}</Text>
                <Text style={styles.priceUnit}> / 30 min</Text>
              </>
            ) : null}
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.action,
              // Fond blanc : le bouton se détache du pied de carte teinté.
              { borderColor: withAlpha(accent, 0.45), backgroundColor: Colors.white },
              pressed && styles.actionPressed,
            ]}
            onPress={onMessage}
            disabled={messaging}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={`Écrire à ${expert.name}`}
          >
            {messaging ? (
              <ActivityIndicator size="small" color={accent} />
            ) : (
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={accent} />
            )}
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.book, { backgroundColor: accent }, pressed && styles.actionPressed]}
            onPress={onBook}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={`Envoyer une demande de consultation à ${expert.name}`}
          >
            <Ionicons name="calendar-outline" size={18} color={Colors.white} />
            <Text style={styles.bookText}>Envoyer une demande</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: CARD_RADIUS,
    backgroundColor: Colors.white,
    // Ombre aux couleurs de l'expert : posée avec la couleur (le web les veut ensemble).
    elevation: 5,
  },
  main: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.md,
    padding: CARD_PADDING,
  },
  photo: {
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
  // Première ligne (titre) alignée sur le haut du portrait.
  info: {
    flex: 1,
    alignItems: 'flex-start',
  },
  honorific: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
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
  domains: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: Spacings.xs,
  },
  domain: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  domainText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 10.5,
    lineHeight: 15,
  },
  price: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingLeft: Spacings.xxs,
  },
  priceValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 17,
    color: Colors.text,
  },
  priceUnit: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.subtext2,
  },
  // Pied de carte sur fond très clair de la couleur de l'expert : prix à gauche, boutons à droite.
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: CARD_PADDING,
    borderBottomLeftRadius: CARD_RADIUS,
    borderBottomRightRadius: CARD_RADIUS,
    gap: Spacings.xs,
    paddingHorizontal: CARD_PADDING,
    paddingBottom: CARD_PADDING,
  },
  action: {
    width: ACTION_SIZE,
    height: ACTION_SIZE,
    borderRadius: ACTION_SIZE / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  book: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: ACTION_SIZE,
    paddingHorizontal: Spacings.md,
    borderRadius: ACTION_SIZE / 2,
  },
  bookText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.white,
  },
  actionPressed: {
    opacity: 0.7,
  },
});
