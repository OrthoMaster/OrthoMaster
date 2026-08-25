import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Accent, palette } from '../lib/Theme';

export type StepTab = {
  id: string;
  label: string;
  // Both variants passed explicitly — no string concatenation. Ionicons
  // doesn't ship an outline twin for every glyph, and TypeScript can't
  // validate a name built at runtime, so a missing pair would only
  // surface as a blank square in the UI.
  icon: keyof typeof Ionicons.glyphMap;
  iconOutline: keyof typeof Ionicons.glyphMap;
  accent: Accent;
  // Relative share of the bar's width. Omit to derive it from the
  // label length.
  weight?: number;
  // Not displayed — only drives the "touched" styling on inactive tabs.
  count: number;
};

type Props = {
  tabs: StepTab[];
  activeIndex: number;
  onSelect: (index: number) => void;
};

const PAD = 5;
const RADIUS = 14;

// Fallback weighting when a tab doesn't declare one. Long labels get
// proportionally more room, but the ramp is deliberately shallow so a
// three-word title can't squeeze a one-word neighbour off the bar.
function weightFor(tab: StepTab): number {
  if (typeof tab.weight === 'number' && tab.weight > 0) return tab.weight;
  return 1 + Math.min(tab.label.length, 24) * 0.045;
}

// Segmented tab bar with a coloured pill sliding behind the active tab.
//
// Tabs are NOT equal width — each takes a share proportional to its
// weight, so "Type de pathologie" gets the room it needs instead of
// wrapping or shrinking its font.
//
// The pill's left + width both animate on the JS driver: layout props
// can't run natively, and mixing drivers on one component throws.
export function StepTabs({ tabs, activeIndex, onSelect }: Props) {
  const [barW, setBarW] = useState(0);

  const left = useRef(new Animated.Value(PAD)).current;
  const width = useRef(new Animated.Value(0)).current;

  // Resolve each tab's pixel width and x-offset from the weights.
  const inner = Math.max(barW - PAD * 2, 0);
  const weights = tabs.map(weightFor);
  const totalW = weights.reduce((s, w) => s + w, 0) || 1;
  const widths = weights.map(w => (inner * w) / totalW);
  const offsets = widths.reduce<number[]>((acc, w, i) => {
    acc.push(i === 0 ? PAD : acc[i - 1] + widths[i - 1]);
    return acc;
  }, []);

  const targetLeft = offsets[activeIndex] ?? PAD;
  const targetWidth = widths[activeIndex] ?? 0;

  useEffect(() => {
    if (inner === 0) return;
    Animated.parallel([
      Animated.spring(left, {
        toValue: targetLeft,
        useNativeDriver: false,
        speed: 16,
        bounciness: 6,
      }),
      Animated.spring(width, {
        toValue: targetWidth,
        useNativeDriver: false,
        speed: 16,
        bounciness: 6,
      }),
    ]).start();
  }, [targetLeft, targetWidth, inner, left, width]);

  const activeAccent = tabs[activeIndex]?.accent;

  return (
    <View style={[styles.bar, activeAccent ? { shadowColor: activeAccent.strong } : null]} onLayout={e => setBarW(e.nativeEvent.layout.width)}>
      {inner > 0 && activeAccent && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            { left, width, backgroundColor: activeAccent.strong },
          ]}
        />
      )}

      {tabs.map((tab, i) => {
        const isActive = i === activeIndex;
        const touched = tab.count > 0;

        return (
          <Pressable
            key={tab.id}
            style={[styles.tab, { flexGrow: weights[i], flexBasis: 0 }]}
            onPress={() => onSelect(i)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Ionicons
              name={isActive ? tab.icon : tab.iconOutline}
              size={21}
              color={
                isActive
                  ? tab.accent.textOn
                  : touched
                    ? tab.accent.strong
                    : palette.textMuted
              }
            />
            <Text
              style={[
                styles.label,
                isActive
                  ? { color: tab.accent.textOn, fontFamily: 'Poppins-Bold' }
                  : touched
                    ? { color: tab.accent.strong, fontFamily: 'Poppins-Bold' }
                    : { color: palette.textMuted, fontFamily: 'Poppins-Medium' },
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginHorizontal: 16,
    marginTop: 0,
    padding: PAD,
    borderRadius: RADIUS + PAD,
    backgroundColor: palette.cardBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  indicator: {
    position: 'absolute',
    top: PAD,
    bottom: PAD,
    borderRadius: RADIUS,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 4,
    gap: 3,
  },
  label: {
    fontSize: 12.5,
    letterSpacing: 0.1,
  },
});