/**
 * Invitation à suivre un sujet — version web.
 *
 * Trois issues : reporter, refuser définitivement, ou accepter.
 * L'autorisation système n'existe pas ici : aucun message à ce sujet.
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { Portal } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../constants/Colors';
import Spacings from '../../constants/Spacings';

import { PermissionState } from '../hooks/useTopicFollowPrompt';

/** Durée d'une oscillation de la cloche */
const SHAKE_STEP = 70;

/** Repos entre deux séries de secousses */
const SHAKE_PAUSE = 2000;

export type TopicFollowDialogProps = {
  visible: boolean;
  topicName: string;
  permission: PermissionState;
  isSubmitting: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onDismiss: () => void;
};

export const TopicFollowDialog = ({
  visible,
  topicName,
  isSubmitting,
  onAccept,
  onDecline,
  onDismiss,
}: TopicFollowDialogProps) => {
  const shake = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const fade = useRef(new Animated.Value(0)).current;

  /** Apparition de la boîte */
  useEffect(() => {
    if (!visible) {
      scale.setValue(0.92);
      fade.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 90,
        friction: 9,
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, scale, fade]);

  /** Secousses de la cloche, en boucle avec un temps de repos */
  useEffect(() => {
    if (!visible) {
      shake.stopAnimation();
      shake.setValue(0);
      return;
    }

    const swing = (toValue: number) =>
      Animated.timing(shake, {
        toValue,
        duration: SHAKE_STEP,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      });

    const loop = Animated.loop(
      Animated.sequence([
        swing(1),
        swing(-1),
        swing(1),
        swing(-1),
        swing(0),
        Animated.delay(SHAKE_PAUSE),
      ])
    );

    loop.start();

    return () => loop.stop();
  }, [visible, shake]);

  const rotate = shake.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-14deg', '14deg'],
  });

  if (!visible) return null;

  return (
    <Portal>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill as any}
          activeOpacity={1}
          onPress={onDismiss}
        />

        <Animated.View
          style={[styles.content, { opacity: fade, transform: [{ scale }] }]}
        >
          <View style={styles.iconHalo}>
            <Animated.View style={{ transform: [{ rotate }] }}>
              <Ionicons name="notifications" size={38} color={Colors.primary} />
            </Animated.View>
          </View>

          <Text style={styles.title}>Restez connectés !</Text>

          <Text style={styles.message}>
            Suive les contenus{' '}
            <Text style={styles.topicName}>{topicName}</Text> ?
          </Text>

          <View style={styles.secondaryRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonLater]}
              onPress={onDecline}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <>
                  <Ionicons
                    name={'notifications-off-outline'}
                    size={18}
                    color={Colors.primary}
                  />
                  <Text style={styles.buttonLaterText}>Ne plus me demander</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonLater]}
              onPress={onDismiss}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <>
                  <Ionicons
                    name={'reload-sharp'}
                    size={18}
                    color={Colors.primary}
                  />
                  <Text style={styles.buttonLaterText}>Me rappeler plus tard</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={onAccept}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-sharp" size={18} color={Colors.white} />
                <Text style={styles.buttonText}>Suivre cette catégorie</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Portal>
  );
};

export default TopicFollowDialog;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: Spacings.xl,
    zIndex: 1000,
  },
  content: {
    backgroundColor: Colors.primaryLightBackground,
    borderRadius: 20,
    paddingTop: Spacings.xl,
    paddingBottom: Spacings.xxl,
    paddingHorizontal: Spacings.lg,
    width: '100%',
    maxWidth: 520,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
  },

  /* ---- Cloche ---- */
  iconHalo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacings.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },

  /* ---- Textes ---- */
  title: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    color: Colors.primary,
    marginBottom: Spacings.xs,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  topicName: {
    fontFamily: 'Poppins-Bold',
    color: Colors.primary,
  },

  /* ---- Actions ---- */
  secondaryRow: {
    flexDirection: 'row',
    gap: Spacings.sm,
    width: '100%',
    marginTop: Spacings.xl,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.xs,
    paddingVertical: Spacings.sm,
    paddingHorizontal: Spacings.xs,
    borderRadius: 12,
    minHeight: 46,
    cursor: 'pointer',
  } as any,
  buttonPrimary: {
    width: '100%',
    marginTop: Spacings.sm,
    backgroundColor: Colors.success,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  buttonLater: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 2,
  },
  buttonDecline: {
    backgroundColor: Colors.danger,
    shadowColor: Colors.danger,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  buttonText: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  buttonLaterText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.primary,
  },
  buttonDeclineText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
});