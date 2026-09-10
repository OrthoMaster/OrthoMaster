/**
 * Renvoi vers un podcast rattaché à la vidéo.
 *
 * La vignette déborde du haut de la carte, inclinée vers la droite,
 * et bat au rythme de l'écoute — même traitement que les infographies,
 * décliné dans le violet des podcasts.
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

import { getPodcastById } from '../../../services/v2/ContentService';

const CARD_HEIGHT = 118;
const PRESS_DEPTH = 7;

/** Taille du médaillon et hauteur dont il dépasse la carte */
const MEDALLION_SIZE = 100;
const MEDALLION_OVERFLOW = 30;

/** Médaillon incliné vers la droite */
const BASE_TILT = 7;

type Props = {
  podcastId: number;
  fallbackTitle?: string;
  navigation: any;
};

export const MediaPodcastBlock = ({ podcastId, fallbackTitle, navigation }: Props) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['podcast', String(podcastId)],
    queryFn: () => getPodcastById(podcastId),
    enabled: !!podcastId,
    retry: 2,
    retryDelay: 2000,
  });

  const podcast = data?.podcast ?? null;

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
        Animated.delay(1500),
        Animated.timing(shineAnim, { toValue: 1, duration: 850, useNativeDriver: true }),
        Animated.timing(shineAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(3500),
      ])
    );

    shine.start();
    return () => shine.stop();
  }, []);

  if (!isLoading && !podcast && !isError) return null;

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
    if (!podcast?.id) return;
    navigation.navigate('flash-podcast', { podcastId: podcast.id, openFrom: 'media' });
  };

  if (isLoading) {
    return (
      <View style={[styles.outer, styles.placeholder]}>
        <ActivityIndicator size="small" color={Colors.purple} />
      </View>
    );
  }

  if (!podcast) {
    return (
      <View style={[styles.outer, styles.placeholder]}>
        <Text style={styles.emptyText}>Ce podcast n'est pas disponible.</Text>
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
                <Ionicons name="mic" size={12} color={Colors.white} />
                <Text style={styles.kindText}>Podcast</Text>

                {!!podcast.duration && (
                  <>
                    <View style={styles.pillSeparator} />
                    <Ionicons name="time-outline" size={11} color={Colors.white} />
                    <Text style={styles.kindText2}>{podcast.duration}</Text>
                  </>
                )}
              </View>

              <Text style={styles.title} numberOfLines={2}>
                {podcast.title ?? fallbackTitle}
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
          {podcast.image ? (
            <Image source={{ uri: podcast.image }} style={styles.medallionImage} resizeMode="cover" />
          ) : (
            <View style={[styles.medallionImage, styles.medallionPlaceholder]} />
          )}

          {/* Voile puis micro : la vignette reste lisible sous l'icône */}
          <View style={styles.medallionVeil} />

          <View style={styles.micBadge}>
            <Ionicons name="mic" size={18} color={Colors.purple} />
          </View>
        </Animated.View>
      </View>
    </Pressable>
  );
};

export default MediaPodcastBlock;

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
    backgroundColor: '#6F528F',
    shadowColor: '#6F528F',
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
    backgroundColor: Colors.purple,
  },
  shine: {
    position: 'absolute',
    top: -80,
    bottom: -80,
    left: 0,
    width: 40,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: Spacings.md,
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
  pillSeparator: {
    width: 1,
    height: 11,
    marginHorizontal: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  kindText: {
    fontSize: 11,
    color: Colors.white,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  kindText2: {
    fontSize: 12,
    color: Colors.white,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.4,
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
  },
  medallionVeil: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    backgroundColor: 'rgba(72, 51, 94, 0.2)',
  },
  micBadge: {
    width: 30,
    height: 30,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: Colors.white,
    fontFamily: 'Poppins-Regular',
  },
});