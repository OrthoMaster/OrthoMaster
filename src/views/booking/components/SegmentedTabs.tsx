import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

interface SegmentedTabsProps<K extends string> {
  tabs: { key: K; label: string; badge?: number }[];
  value: K;
  onChange: (key: K) => void;
  /** Couleur de la pastille active (bleu de l'espace par défaut, palette de l'expert sinon). */
  color?: string;
  /** Fond et bordure du rail, pour se fondre dans un fond teinté. */
  surface?: string;
  borderColor?: string;
}

const PADDING = Spacings.xxs;

/** Onglets en pill segmented : la pastille colorée glisse derrière l'onglet choisi. */
export const SegmentedTabs = <K extends string>({
  tabs,
  value,
  onChange,
  color = Colors.lblueDark,
  surface = Colors.white,
  borderColor = Colors.border,
}: SegmentedTabsProps<K>) => {
  const [width, setWidth] = useState(0);
  const slide = useRef(new Animated.Value(0)).current;
  const positioned = useRef(false);

  const index = Math.max(0, tabs.findIndex((tab) => tab.key === value));
  const segment = width ? (width - PADDING * 2) / tabs.length : 0;

  useEffect(() => {
    if (!segment) return;

    // Premier affichage : la pastille se pose sans glisser depuis la gauche.
    if (!positioned.current) {
      slide.setValue(index * segment);
      positioned.current = true;
      return;
    }
    Animated.spring(slide, { toValue: index * segment, friction: 9, tension: 80, useNativeDriver: true }).start();
  }, [index, segment]);

  return (
    <View
      style={[styles.container, { backgroundColor: surface, borderColor }]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {segment > 0 && (
        <Animated.View
          style={[styles.pill, { width: segment, backgroundColor: color, transform: [{ translateX: slide }] }]}
        />
      )}

      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
            {tab.badge ? (
              <View style={[styles.badge, active && styles.badgeActive]}>
                <Text style={[styles.badgeText, active && styles.labelActive]}>{tab.badge}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: PADDING,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  pill: {
    position: 'absolute',
    top: PADDING,
    bottom: PADDING,
    left: PADDING,
    borderRadius: 9,
    backgroundColor: Colors.lblueDark,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.xxs,
    paddingVertical: Spacings.xs,
  },
  label: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.subtext,
  },
  labelActive: {
    color: Colors.white,
  },
  badge: {
    paddingHorizontal: Spacings.xs,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.07)',
  },
  badgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  badgeText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    color: Colors.subtext,
  },
});