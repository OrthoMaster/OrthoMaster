import React, { useEffect, useRef, useState } from 'react';
import { Text, Pressable, StyleSheet, Animated, Easing, Platform, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

const useNativeDriver = Platform.OS !== 'web';

/** Largeur du reflet qui balaie le bouton. */
const SHINE_WIDTH = 36;

type Props = {
  onPress: () => void;
  /** Texte à côté de l'icône (web) ; sans texte, bouton carré (mobile). */
  label?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Bouton d'accès à l'assistant, posé sur l'en-tête rouge de la recherche.
 * Deux animations discrètes, en boucle avec des pauses : l'icône scintille (rotation +
 * grossissement), puis un reflet lumineux traverse le bouton.
 */
export const AiAssistantButton: React.FC<Props> = ({ onPress, label, style }) => {
  const [buttonWidth, setButtonWidth] = useState(0);
  const twinkle = useRef(new Animated.Value(0)).current;
  const shine = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(twinkle, { toValue: 1, duration: 380, easing: Easing.out(Easing.back(2)), useNativeDriver }),
        Animated.timing(twinkle, { toValue: 0, duration: 380, easing: Easing.inOut(Easing.quad), useNativeDriver }),
        // Le reflet part quand l'étoile retombe.
        Animated.timing(shine, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver }),
        Animated.timing(shine, { toValue: 0, duration: 0, useNativeDriver }),
        Animated.delay(2600),
      ])
    );
    loop.start();

    return () => loop.stop();
  }, [twinkle, shine]);

  const iconStyle = {
    transform: [
      { rotate: twinkle.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-18deg'] }) },
      { scale: twinkle.interpolate({ inputRange: [0, 1], outputRange: [1, 1.28] }) },
    ],
  };

  const shineStyle = {
    transform: [
      { translateX: shine.interpolate({ inputRange: [0, 1], outputRange: [-SHINE_WIDTH * 2, buttonWidth + SHINE_WIDTH] }) },
      { skewX: '-20deg' },
    ],
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Ouvrir l'assistant IA"
      onLayout={(e) => setButtonWidth(e.nativeEvent.layout.width)}
      style={({ hovered, pressed }: any) => [
        styles.button,
        !label && styles.iconOnly,
        (hovered || pressed) && styles.buttonActive,
        style,
      ]}
    >
      {/* Reflet : derrière le contenu, coupé aux bords du bouton */}
      {buttonWidth > 0 && (
        <Animated.View pointerEvents="none" style={[styles.shine, shineStyle]}>
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}

      <Animated.View style={iconStyle}>
        <Ionicons name="sparkles" size={label ? 18 : 20} color={Colors.white} />
      </Animated.View>

      {!!label && <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    gap: Spacings.xs,
    paddingHorizontal: Spacings.md,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    transitionDuration: '150ms' as any,
  },
  iconOnly: {
    width: 44,
    paddingHorizontal: 0,
  },
  buttonActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderColor: Colors.white,
  },
  shine: {
    position: 'absolute',
    top: -4,
    bottom: -4,
    left: 0,
    width: SHINE_WIDTH,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
});