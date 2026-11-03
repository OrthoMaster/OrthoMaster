import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, Pressable, Animated, ActivityIndicator, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../../constants/Colors';
import Spacings from '../../../../../constants/Spacings';

import { BookingExpertListItem } from '../../../../services/v2/BookingService';
import { initials, priceLabel } from '../../bookingFormat';
import { CONSULT_COLOR, CONSULT_SOFT } from '../../bookingKinds';
import { CHAT_BLUE } from '../../messages/chatFormat';
import { SearchReason } from './SearchReason';

const CARD_RADIUS = 20;
const CARD_PADDING = Spacings.sm;
const PHOTO_RADIUS = 14;
const PHOTO_MIN = 92;
const PHOTO_MAX = 132;
const STAGGER_MS = 60;
/** Pastilles de domaines affichées ; au-delà, « +n ». */
const MAX_DOMAINS = 3;
const ACTION_SIZE = 42;

interface ConsultationExpertCardProps {
  expert: BookingExpertListItem;
  width: number;
  /** Rang dans sa page (0–9), pour l'entrée en cascade. */
  indexInPage: number;
  /** Toucher la carte : profil de l'expert. */
  onPress: () => void;
  /** Bouton bleu : écrire à l'expert. */
  onMessage: () => void;
  /** Bouton violet : demander une consultation. */
  onBook: () => void;
  /** Ouverture du fil en cours (bouton message en attente). */
  messaging?: boolean;
}

/**
 * Carte d'un expert dans la liste Consultation (mobile et web) : pas de thèmes, le prix de
 * 30 minutes au coin supérieur droit, les domaines en petites pastilles, et deux boutons
 * ronds : écrire (bleu) ou réserver une consultation (violet).
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
  const shown = domains.slice(0, MAX_DOMAINS);
  const more = domains.length - shown.length;
  const consult = expert.consultation;

  return (
    <Animated.View style={[{ width }, animated]}>
      <View style={styles.card}>
        <Pressable
          style={styles.main}
          onPress={onPress}
          onPressIn={() => animatePress(1)}
          onPressOut={() => animatePress(0)}
          accessibilityRole="button"
          accessibilityLabel={[expert.honorific, expert.name].filter(Boolean).join(' ')}
        >
          <View style={[styles.photo, { width: photoSize, height: photoSize }]}>
            {expert.avatar_url ? (
              <Image source={{ uri: expert.avatar_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <Text style={[styles.initials, { fontSize: Math.round(photoSize * 0.3) }]}>{initials(expert.name)}</Text>
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

            {shown.length > 0 ? (
              <View style={styles.domains}>
                {shown.map((d) => (
                  <View key={d.id} style={styles.domain}>
                    <Text style={styles.domainText} numberOfLines={1}>
                      {d.name}
                    </Text>
                  </View>
                ))}
                {more > 0 ? (
                  <View style={styles.domain}>
                    <Text style={styles.domainText}>+{more}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {expert.reason ? <SearchReason text={expert.reason} /> : null}
          </View>

          {/* Prix de 30 minutes, au coin supérieur droit. */}
          {consult ? (
            <View style={styles.price} pointerEvents="none">
              <Text style={styles.priceValue}>{priceLabel(consult.price_30, consult.currency)}</Text>
              <Text style={styles.priceUnit}> / 30 min</Text>
            </View>
          ) : null}
        </Pressable>

        {/* ---- Actions : écrire (bleu), réserver (violet) ---- */}
        <View style={styles.actions}>
          <View style={styles.visio}>
            <Ionicons name="videocam-outline" size={14} color={Colors.subtext} />
            <Text style={styles.visioText}>En visio, par 30 min</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.action, styles.actionMessage, pressed && styles.actionPressed]}
            onPress={onMessage}
            disabled={messaging}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={`Écrire à ${expert.name}`}
          >
            {messaging ? (
              <ActivityIndicator size="small" color={CHAT_BLUE} />
            ) : (
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={CHAT_BLUE} />
            )}
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.action, styles.actionBook, pressed && styles.actionPressed]}
            onPress={onBook}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={`Réserver une consultation avec ${expert.name}`}
          >
            <Ionicons name="calendar-outline" size={20} color={Colors.white} />
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
    shadowColor: CONSULT_COLOR,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 5,
  },
  main: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.md,
    padding: CARD_PADDING,
  },
  photo: {
    backgroundColor: CONSULT_COLOR,
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
  // Marge haute : la première ligne passe sous le prix sans le toucher.
  info: {
    flex: 1,
    alignItems: 'flex-start',
    paddingTop: Spacings.lg,
  },
  honorific: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: CONSULT_COLOR,
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
    maxWidth: 160,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: CONSULT_SOFT,
  },
  domainText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 10.5,
    lineHeight: 15,
    color: CONSULT_COLOR,
  },
  price: {
    position: 'absolute',
    top: CARD_PADDING,
    right: Spacings.md,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: CONSULT_COLOR,
  },
  priceUnit: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.subtext2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    marginHorizontal: CARD_PADDING,
    paddingVertical: Spacings.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  visio: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: Spacings.xxs,
  },
  visioText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.subtext,
  },
  action: {
    width: ACTION_SIZE,
    height: ACTION_SIZE,
    borderRadius: ACTION_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionMessage: {
    borderWidth: 1.5,
    borderColor: 'rgba(10, 124, 255, 0.35)',
    backgroundColor: 'rgba(10, 124, 255, 0.08)',
  },
  actionBook: {
    backgroundColor: CONSULT_COLOR,
  },
  actionPressed: {
    opacity: 0.7,
  },
});
