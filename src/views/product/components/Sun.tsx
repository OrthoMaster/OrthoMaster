import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { palette } from '../lib/Theme';

// Pressable wrapped with Animated so we can keep the body's animated
// styling (color/shadow) while still receiving touches.
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type SunProps = {
  x: number;
  y: number;
  radius: number;
  count: number;
  isLit: boolean;       // true when count > 0
  onPress?: () => void; // when provided, the sun body becomes tappable
};

// Sun with two states:
// - Lit: warm bright body, breathing halo, count + label visible
// - Dim: cold gray body, no halo, "no match" appearance
// Smooth crossfade between states.
export function Sun({ x, y, radius, count, isLit, onPress }: SunProps) {
  // Two separate Animated.Values driven in parallel:
  // - litColor: JS-driven (for color interpolation in body/text)
  // - litNative: native-driven (for opacity multiplication on halo)
  // We can't share one value across both drivers — once a value runs on
  // native, JS driver throws "moved to native" errors and vice versa.
  const litColor = useRef(new Animated.Value(isLit ? 1 : 0)).current;
  const litNative = useRef(new Animated.Value(isLit ? 1 : 0)).current;
  const breathe = useRef(new Animated.Value(0)).current;

  // Crossfade lit state — fire BOTH animations in parallel
  useEffect(() => {
    Animated.parallel([
      Animated.timing(litColor, {
        toValue: isLit ? 1 : 0,
        duration: 450,
        useNativeDriver: false,    // colors must use JS driver
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(litNative, {
        toValue: isLit ? 1 : 0,
        duration: 450,
        useNativeDriver: true,     // opacity / transform on native
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, [isLit, litColor, litNative]);

  // Breathing halo when lit
  useEffect(() => {
    if (!isLit) {
      breathe.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1, duration: 2200, useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(breathe, {
          toValue: 0, duration: 2200, useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isLit, breathe]);

  const haloScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const haloOpacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });

  const size = radius * 2;
  const haloSize = size * 1.2;

  // Color interpolation between lit (warm gold) and dim (cool gray)
  const bodyColor = litColor.interpolate({
    inputRange: [0, 1],
    outputRange: ['#C5C8D1', '#FFD78A'],
  });
  const innerColor = litColor.interpolate({
    inputRange: [0, 1],
    outputRange: ['#DDE0E8', '#FFE9B5'],
  });
  const textColor = litColor.interpolate({
    inputRange: [0, 1],
    outputRange: ['#7E8395', palette.textPrimary],
  });

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, {
        left: x - haloSize / 2,
        top: y - haloSize / 2,
        width: haloSize,
        height: haloSize,
      }]}
    >
      {/* Outer warm halo (only when lit) */}
      <Animated.View
        style={[styles.halo, {
          width: haloSize,
          height: haloSize,
          borderRadius: haloSize / 2,
          opacity: Animated.multiply(litNative, haloOpacity),
          transform: [{ scale: haloScale }],
        }]}
      />

      {/* Body — tappable when onPress is provided. When omitted, this still
          behaves like a normal Animated.View since Pressable without an
          onPress is effectively inert. */}
      <AnimatedPressable
        onPress={onPress}
        disabled={!onPress}
        style={[styles.body, {
          width: size,
          height: size,
          borderRadius: radius,
          left: (haloSize - size) / 2,
          top: (haloSize - size) / 2,
          backgroundColor: bodyColor,
        }]}
      >
        {/* Inner highlight for sphere feel */}
        <Animated.View
          style={[styles.innerHighlight, {
            width: size * 0.65,
            height: size * 0.65,
            borderRadius: (size * 0.65) / 2,
            backgroundColor: innerColor,
          }]}
        />

        {/* Specular */}
        <View style={[styles.specular, {
          width: size * 0.22,
          height: size * 0.22,
          borderRadius: (size * 0.22) / 2,
          top: size * 0.18,
          left: size * 0.22,
        }]} />

        {/* Count text */}
        <Animated.Text style={[styles.count, { color: textColor }]}>
          {count}
        </Animated.Text>
        <Animated.Text style={[styles.label, { color: textColor }]}>
          {count === 1 ? 'match' : 'matches'}
        </Animated.Text>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 184, 88, 0.22)',
  },
  body: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#E8A847',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 22,
    elevation: 10,
  },
  innerHighlight: {
    position: 'absolute',
    top: '8%',
    opacity: 0.55,
  },
  specular: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    opacity: 0.7,
  },
  count: {
    fontSize: 30,
    fontFamily: 'Poppins-Bold',
    letterSpacing: -0.1,
    zIndex: 2,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 1,
    zIndex: 2,
    opacity: 0.9,
  },
});