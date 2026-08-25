import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Accent, palette } from '../lib/Theme';

const isWeb = Platform.OS === 'web';

type PlanetProps = {
  cx: number;
  cy: number;
  size: number;
  zDepth: number;            // 0..1 — perspective depth from layout
  nodeId: string;
  title: string;
  // Each chosen value (across the planet's own selections + linked
  // children) is shown inside the sphere when present.
  selectedLabels: string[];
  // Active = options sheet is open for this node.
  isActive: boolean;
  // Has at least one selection on this planet OR any linked node.
  hasSelection: boolean;
  // Has some selections but not every reachable filter node is filled
  // yet — triggers a small "!" badge to hint "you can add more here".
  hasMoreToChoose?: boolean;
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
//   6. In-sphere content: title (big when no selection, small caption
//      when there are selected labels) + joined labels block.
export function PlanetBody({
  cx, cy, size, zDepth,
  nodeId, title,
  selectedLabels, isActive, hasSelection, hasMoreToChoose,
  accent, onPress,
}: PlanetProps) {
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
      pointerEvents="box-none"
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
        {/* <View
          style={[styles.sphereLayer, {
            width: size * 0.22,
            height: size * 0.22,
            borderRadius: (size * 0.22) / 2,
            top: size * 0.16,
            left: size * 0.22,
            backgroundColor: '#FFFFFF',
            opacity: bodyOpacity * (hasSelection ? 0.6 : 0.45),
          }]}
        /> */}

        {/* Inner content of the sphere — adaptive layout:
            - No selection: title fills the centre (big).
            - With selection: title shrinks to a small uppercase caption at
              the top and selected labels render as a joined string just
              below it, wrapping inside the sphere area. */}
        <View pointerEvents="none" style={[styles.sphereContent, { width: size, height: size }]}>
          {selectedLabels.length === 0 ? (
            <Text
              style={[
                styles.titleCentered,
                { color: hasSelection ? accent.textOn : '#FFFFFF' },
                isActive && styles.titleActive,
              ]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
          ) : (
            <>
              <Text
                style={[
                  styles.titleSmall,
                  { color: hasSelection ? accent.textOn : '#FFFFFF' },
                  isActive && styles.titleActive,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {title}
              </Text>
              <Text
                style={[
                  styles.labelsInline,
                  { color: hasSelection ? accent.textOn : '#FFFFFF' },
                ]}
                numberOfLines={3}
                ellipsizeMode="tail"
              >
                {selectedLabels.join(' · ')}
              </Text>
            </>
          )}
        </View>

        {/* "!" badge — top-right of the sphere. Amber warning tint
            signals "you can add more filters here" without alarming
            the user. Sized proportionally to the planet, min 20px so
            small planets still show a legible glyph. */}
        {hasMoreToChoose && (() => {
          const badgeSize = Math.max(14, size * 0.196);
          return (
            <View
              pointerEvents="none"
              style={[styles.moreBadge, {
                width: badgeSize,
                height: badgeSize,
                borderRadius: badgeSize / 2,
                top: size * 0.04,
                right: size * 0.04,
              }]}
            >
              <Text style={[styles.moreBadgeText, {
                fontSize: badgeSize * 0.6,
                lineHeight: badgeSize * 0.75,
              }]}>+</Text>
            </View>
          );
        })()}
      </Pressable>
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
    opacity: 0.75,
  },
  haloWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spherePos: {
    position: 'absolute',
  },
  sphereLayer: {
    position: 'absolute',
  },

  // Container for in-sphere content. Centers the column; padding keeps
  // text from touching the round edge.
  sphereContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  // Big title — when there are no selected labels (centred in sphere)
  titleCentered: {
    fontSize: isWeb ? 20 : 12,
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
    lineHeight: isWeb ? 24 : 16,
  },

  // Small title — when selected labels exist (sits above the labels block)
  titleSmall: {
    fontSize: isWeb ? 16 : 10,
    fontFamily: 'Poppins-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textAlign: 'center',
    opacity: 0.85,
    marginBottom: 3,
  },

  // Joined labels — "A · B · C". Wraps up to 3 lines inside the sphere
  // area; overflowing the last line gets a tail ellipsis.
  labelsInline: {
    fontSize: isWeb ? 26 : 16,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
    lineHeight: isWeb ? 34 : 20,
    letterSpacing: 1.1,
  },

  titleActive: {
    fontWeight: '700',
  },

  // Warning badge in the top-right corner of the sphere. Signals
  // "planet has some but not all reachable filters filled". Amber tint
  // + white border to pop against any accent color. Sized inline in
  // JSX because it scales with planet size.
  moreBadge: {
    position: 'absolute',
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  moreBadgeText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
    fontWeight: '800',
    textAlign: 'center',
  },
});