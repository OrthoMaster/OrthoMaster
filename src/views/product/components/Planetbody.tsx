import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Accent, palette } from '../lib/Theme';

type PlanetProps = {
  cx: number;
  cy: number;
  size: number;
  zDepth: number;            // 0..1 — perspective depth from layout
  nodeId: string;
  title: string;
  // Each chosen value (across the planet's own selections + linked
  // children) becomes a chip below the title.
  selectedLabels: string[];
  // Active = options sheet is open for this node.
  isActive: boolean;
  // Has at least one selection on this planet OR any linked node.
  hasSelection: boolean;
  accent: Accent;
  onPress: () => void;
};

// Sphere look using layered Views (no SVG — kinder on perf during orbit).
// Tiers from outer to inner:
//   1. Glow ring (when hasSelection): accent halo, breathing
//   2. Sphere shadow disc (back hemisphere shading)
//   3. Sphere body (color)
//   4. Sphere highlight (top-left lightened crescent)
//   5. Specular dot (top-left small white)
//   6. Title + chips below
export function PlanetBody({
  cx, cy, size, zDepth,
  nodeId, title,
  selectedLabels, isActive, hasSelection,
  accent, onPress,
}: PlanetProps) {
  // Pulse ring on active
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!isActive) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isActive, pulse]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.65, 0] });

  // Breathing halo when has selection
  const breathe = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!hasSelection) {
      breathe.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1, duration: 2000 + (cx % 700), useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(breathe, {
          toValue: 0, duration: 2000 + (cx % 700), useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [hasSelection, breathe, cx]);

  const haloScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const haloOpacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.85] });

  // Geometry
  const haloSize = size * 1.7;
  // Disabled (no selection) → desaturated gray
  const bodyColor = hasSelection ? accent.strong : '#C8CFDB';
  const bodyDarkColor = hasSelection ? darkenHex(accent.strong, 0.32) : '#9098AA';
  const bodyLightColor = hasSelection ? lightenHex(accent.strong, 0.28) : '#E2E6EE';

  // Z-depth affects shadow intensity & overall opacity slightly
  const shadowOpacity = 0.18 + zDepth * 0.32;
  const bodyOpacity = hasSelection ? 1 : 0.6;

  return (
    <View
      style={[styles.wrap, {
        left: cx - haloSize / 2,
        top: cy - haloSize / 2,
        width: haloSize,
        height: haloSize,
      }]}
    >
      {/* Glow halo when has selection — radial gradient fades to transparent at the edge */}
      {hasSelection && (
        <Animated.View
          pointerEvents="none"
          style={[styles.haloWrap, {
            width: haloSize,
            height: haloSize,
            opacity: haloOpacity,
            transform: [{ scale: haloScale }],
          }]}
        >
          <Svg width={haloSize} height={haloSize}>
            <Defs>
              <RadialGradient
                id={`halo-${nodeId}`}
                cx="50%"
                cy="50%"
                rx="50%"
                ry="50%"
              >
                <Stop offset="0%" stopColor={accent.strong} stopOpacity="0.55" />
                <Stop offset="35%" stopColor={accent.strong} stopOpacity="0.32" />
                <Stop offset="70%" stopColor={accent.strong} stopOpacity="0.10" />
                <Stop offset="100%" stopColor={accent.strong} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx={haloSize / 2} cy={haloSize / 2} r={haloSize / 2} fill={`url(#halo-${nodeId})`} />
          </Svg>
        </Animated.View>
      )}

      {/* Pulse ring on active */}
      {isActive && (
        <Animated.View
          pointerEvents="none"
          style={[styles.pulseRing, {
            width: size * 1.25,
            height: size * 1.25,
            borderRadius: size * 0.625,
            borderColor: hasSelection ? accent.strong : palette.textSecondary,
            top: (haloSize - size * 1.25) / 2,
            left: (haloSize - size * 1.25) / 2,
            transform: [{ scale: ringScale }],
            opacity: ringOpacity,
          }]}
        />
      )}

      {/* Sphere */}
      <Pressable
        onPress={onPress}
        hitSlop={10}
        style={[styles.spherePos, {
          width: size,
          height: size,
          left: (haloSize - size) / 2,
          top: (haloSize - size) / 2,
        }]}
      >
        {/* Shadow disc — bottom-right darkening */}
        <View
          style={[styles.sphereLayer, {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bodyDarkColor,
            opacity: bodyOpacity,
          }]}
        />

        {/* Main body */}
        <View
          style={[styles.sphereLayer, {
            width: size * 0.96,
            height: size * 0.96,
            borderRadius: (size * 0.96) / 2,
            top: size * 0.02,
            left: size * 0.02,
            backgroundColor: bodyColor,
            opacity: bodyOpacity,
            shadowColor: hasSelection ? accent.strong : '#000000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity,
            shadowRadius: 8,
            elevation: 4,
          }]}
        />

        {/* Highlight crescent — upper-left brightening */}
        <View
          style={[styles.sphereLayer, {
            width: size * 0.78,
            height: size * 0.78,
            borderRadius: (size * 0.78) / 2,
            top: size * 0.05,
            left: size * 0.05,
            backgroundColor: bodyLightColor,
            opacity: bodyOpacity * 0.85,
          }]}
        />

        {/* Specular */}
        <View
          style={[styles.sphereLayer, {
            width: size * 0.22,
            height: size * 0.22,
            borderRadius: (size * 0.22) / 2,
            top: size * 0.16,
            left: size * 0.22,
            backgroundColor: '#FFFFFF',
            opacity: bodyOpacity * (hasSelection ? 0.6 : 0.45),
          }]}
        />
      </Pressable>

      {/* Title + chips below */}
      <View
        pointerEvents="none"
        style={[styles.labelWrap, {
          top: haloSize - 8,
          width: Math.max(140, size + 80),
          left: (haloSize - Math.max(140, size + 80)) / 2,
        }]}
      >
        <Text
          style={[
            styles.title,
            !hasSelection && styles.titleDim,
            isActive && styles.titleActive,
          ]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
        {selectedLabels.length > 0 && (
          <View style={styles.chipRow}>
            {selectedLabels.slice(0, 3).map((lbl, i) => (
              <View
                key={i}
                style={[styles.chip, { backgroundColor: accent.soft, borderColor: accent.strong }]}
              >
                <Text
                  style={[styles.chipText, { color: accent.text }]}
                  numberOfLines={1}
                >
                  {lbl}
                </Text>
              </View>
            ))}
            {selectedLabels.length > 3 && (
              <View style={[styles.chip, { backgroundColor: accent.soft, borderColor: accent.strong }]}>
                <Text style={[styles.chipText, { color: accent.text }]}>
                  +{selectedLabels.length - 3}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

// ---- color helpers ----
function clamp(n: number) { return Math.max(0, Math.min(255, Math.round(n))); }
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}
function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map(c => clamp(c).toString(16).padStart(2, '0')).join('')}`;
}
function lightenHex(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
}
function darkenHex(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    opacity: 0.55,
  },
  haloWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2.5,
  },
  spherePos: {
    position: 'absolute',
  },
  sphereLayer: {
    position: 'absolute',
  },
  labelWrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.textPrimary,
    letterSpacing: -0.1,
    textAlign: 'center',
    lineHeight: 16,
  },
  titleDim: {
    color: palette.textMuted,
    fontWeight: '500',
  },
  titleActive: {
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 4,
    gap: 4,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 110,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
});