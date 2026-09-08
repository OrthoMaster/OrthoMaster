/**
 * Renvoi vers une infographie rattachée à la vidéo.
 *
 * La vignette déborde du haut de la carte, à la manière d'une feuille
 * posée en travers : les infographies n'ayant pas de format commun,
 * ce médaillon les présente sans imposer de proportions.
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import { getInfographicById } from '../../../services/v2/ContentService';

const CARD_HEIGHT = 118;
const PRESS_DEPTH = 7;

/** Taille du médaillon et hauteur dont il dépasse la carte */
const MEDALLION_SIZE = 100;
const MEDALLION_OVERFLOW = 30;

/** Médaillon incliné vers la gauche */
const BASE_TILT = 7;

type Props = {
  infographicId: number;
  fallbackTitle?: string;
  navigation: any;
};

export const MediaInfographicBlock = ({ infographicId, fallbackTitle, navigation }: Props) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['infographic', String(infographicId)],
    queryFn: () => getInfographicById(infographicId),
    enabled: !!infographicId,
    retry: 2,
    retryDelay: 2000,
  });

  const infographic = data?.infographic ?? null;

  const pressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;

  /** Battement du médaillon, avec un temps de repos entre deux séries */
  useEffect(() => {
    const motion = Animated.loop(
      Animated.sequence([
        Animated.delay(800),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(5000),
      ])
    );

    motion.start();
    return () => motion.stop();
  }, []);

  /** Reflet qui balaie la carte */
  useEffect(() => {
    const shine = Animated.loop(
      Animated.sequence([
        Animated.delay(2000),
        Animated.timing(shineAnim, { toValue: 1, duration: 850, useNativeDriver: true }),
        Animated.timing(shineAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(3500),
      ])
    );

    shine.start();
    return () => shine.stop();
  }, []);

  if (!isLoading && !infographic && !isError) return null;

  const pressIn = () =>
    Animated.spring(pressAnim, { toValue: 1, speed: 50, bounciness: 0, useNativeDriver: true }).start();

  const pressOut = () =>
    Animated.spring(pressAnim, { toValue: 0, speed: 20, bounciness: 10, useNativeDriver: true }).start();

  const pushY = pressAnim.interpolate({ inputRange: [0, 1], outputRange: [0, PRESS_DEPTH] });
  const shineX = shineAnim.interpolate({ inputRange: [0, 1], outputRange: [-90, 520] });
  const pulse = pulseAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [1, 1.09, 1, 1.09, 1],
  });

  const open = () => {
    if (!infographic?.id) return;
    navigation.navigate('infographic', { infographicId: infographic.id, openFrom: 'media' });
  };

  if (isLoading) {
    return (
      <View style={[styles.outer, styles.placeholder]}>
        <ActivityIndicator size="small" color={Colors.primaryLight} />
      </View>
    );
  }

  if (!infographic) {
    return (
      <View style={[styles.outer, styles.placeholder]}>
        <Text style={styles.emptyText}>Cette infographie n'est pas disponible.</Text>
      </View>
    );
  }

  return (
    <Pressable onPress={open} onPressIn={pressIn} onPressOut={pressOut}>
      {/* Le médaillon dépasse : la zone réservée le laisse déborder */}
      <View style={styles.wrapper}>
        <View style={styles.outer}>
          <Animated.View style={[styles.inner, { transform: [{ translateY: pushY }] }]}>
            <Animated.View
              pointerEvents="none"
              style={[styles.shine, { transform: [{ translateX: shineX }, { rotate: '18deg' }] }]}
            />

            <View style={styles.content}>
              <View style={styles.kindPill}>
                <Ionicons name="image" size={12} color={Colors.white} />
                <Text style={styles.kindText}>Infographie</Text>
              </View>

              <Text style={styles.title} numberOfLines={2}>
                {infographic.title ?? fallbackTitle}
              </Text>
            </View>
          </Animated.View>
        </View>

        <Animated.View
          pointerEvents="none"
          style={[
            styles.medallion,
            {
              transform: [
                { rotate: `${BASE_TILT}deg` },
                { scale: pulse },
                { translateY: pushY },
              ],
            },
          ]}
        >
          {infographic.image ? (
            <Image source={{ uri: infographic.image }} style={styles.medallionImage} resizeMode="cover" />
          ) : (
            <View style={[styles.medallionImage, styles.medallionPlaceholder]}>
              <Ionicons name="image-outline" size={30} color={Colors.gray} />
            </View>
          )}
        </Animated.View>
      </View>
    </Pressable>
  );
};

export default MediaInfographicBlock;

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    // Le médaillon déborde vers le haut : la place lui est réservée ici
    paddingTop: MEDALLION_OVERFLOW,
  },
  outer: {
    borderRadius: 22,
    paddingBottom: PRESS_DEPTH,
    backgroundColor: '#D97A00',
    shadowColor: '#D97A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  placeholder: {
    height: CARD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: CARD_HEIGHT,
    paddingVertical: Spacings.lg,
    paddingLeft: Spacings.lg,
    // Place laissée au médaillon, posé à droite
    paddingRight: MEDALLION_SIZE + Spacings.md,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: Colors.primaryLight,
  },
  shine: {
    position: 'absolute',
    top: -80,
    bottom: -80,
    left: 0,
    width: 40,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  kindPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    marginBottom: Spacings.xs,
    paddingHorizontal: Spacings.sm,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  kindText: {
    fontSize: 11,
    color: Colors.white,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    color: Colors.white,
    fontFamily: 'Poppins-Medium',
  },

  /* ---- Médaillon ---- */
  medallion: {
    position: 'absolute',
    right: Spacings.md,
    top: 0,
    width: MEDALLION_SIZE,
    height: MEDALLION_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    // Cadre blanc puis liseré gris : une image claire reste détachée du fond
    borderWidth: 2,
    borderColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 4,
  },
  medallionImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.line,
  },
  medallionPlaceholder: {
    backgroundColor: Colors.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: Colors.white,
    fontFamily: 'Poppins-Regular',
  },
});