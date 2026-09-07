/**
 * Invitation à suivre un sujet, posée à la sortie d'un contenu.
 *
 * Trois issues : reporter, refuser définitivement, ou accepter.
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
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
  permission,
  isSubmitting,
  onAccept,
  onDecline,
  onDismiss,
}: TopicFollowDialogProps) => {
  const shake = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const fade = useRef(new Animated.Value(0)).current;

  /** Apparition de la boîte */
  useEffect(() => {
    if (!visible) {
      scale.setValue(0.9);
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

  /** L'autorisation bloquée impose un détour par les réglages */
  const needsSettings = permission === 'denied';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Animated.View
          style={[styles.content, { opacity: fade, transform: [{ scale }] }]}
        >
          <View style={styles.iconHalo}>
            <Animated.View style={{ transform: [{ rotate }] }}>
              <Ionicons name="notifications" size={38} color={Colors.primary} />
            </Animated.View>
          </View>

          <Text style={styles.title}>Restons connectés !</Text>

          <Text style={styles.message}>
            Suivez les contenus{' '}
            <Text style={styles.topicName}>{topicName}</Text> ?
          </Text>

          {/* L'autorisation a été refusée : le suivi reste possible, mais
              aucune notification ne parviendra tant qu'elle n'est pas rétablie */}
          {!needsSettings && (
            <View style={styles.notice}>
              <Ionicons name="warning" size={22} color={Colors.primary} />
              <Text style={styles.noticeText}>
                Pour recevoir des quizz, podcasts et infographies selon vos envies, veuillez activer les notifications.
              </Text>
            </View>
          )}

          <View style={styles.secondaryRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonLater]}
              onPress={onDismiss}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonLaterText}>Plus tard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonDecline]}
              onPress={onDecline}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonDeclineText}>Non merci</Text>
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
                <Ionicons
                  name={needsSettings ? 'settings' : 'notifications'}
                  size={18}
                  color={Colors.white}
                />
                <Text style={styles.buttonText}>
                  {needsSettings ? 'Ouvrir les réglages' : 'J’active les notifications'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default TopicFollowDialog;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: Spacings.xl,
  },
  content: {
    backgroundColor: Colors.primaryLightBackground,
    borderRadius: 20,
    paddingTop: Spacings.xl,
    paddingBottom: Spacings.xxl,
    paddingHorizontal: Spacings.lg,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 12,
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
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: Colors.primary,
    marginBottom: Spacings.xs,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 21,
  },
  topicName: {
    fontFamily: 'Poppins-Medium',
    color: Colors.primary,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.xs,
    marginTop: Spacings.md,
    padding: Spacings.sm,
    backgroundColor: Colors.white,
    borderRadius: 10,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
  },

  /* ---- Actions ---- */
  secondaryRow: {
    flexDirection: 'row',
    gap: Spacings.md,
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
  },
  buttonPrimary: {
    width: '100%',
    marginTop: Spacings.md,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
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
  buttonLaterText: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: Colors.primary,
  },
  buttonDecline: {
    backgroundColor: Colors.danger,
    shadowColor: Colors.danger,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDeclineText: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
  },
  buttonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    textAlign: 'center',
  },
  buttonGhostText: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: Colors.gray,
  },
});