import React, { useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';
import { DailyActionGroup, ACTION_THEMES } from './dailyActions';

const PRESS_DEPTH = 3;

/** « +N » quand le groupe ouvre une liste, flèche quand on ouvre directement l'unique élément. */
export const CountBadge = ({ group, size = 26 }: { group: DailyActionGroup; size?: number }) => {
  const theme = ACTION_THEMES[group.type];
  const others = group.items.length - 1;

  if (others <= 0) {
    return (
      <View style={[styles.badge, styles.badgeSoft, { height: size, minWidth: size, borderRadius: size / 2 }]}>
        <Ionicons name="chevron-forward" size={size * 0.58} color={theme.ink} />
      </View>
    );
  }

  return (
    <View style={[styles.badge, { height: size, minWidth: size, borderRadius: size / 2, paddingHorizontal: 8 }]}>
      <Text style={[styles.badgeText, { color: theme.ink }]}>+{others}</Text>
    </View>
  );
};

/** Pastille rouge s'il y a du nouveau ; coche verte quand tous les quiz sont répondus. */
export const StatusMark = ({ group, style }: { group: DailyActionGroup; style?: StyleProp<ViewStyle> }) => {
  if (group.allDone) {
    return (
      <View style={[styles.check, style]} accessibilityLabel="Tout est répondu">
        <Ionicons name="checkmark-sharp" size={12} color={Colors.white} />
      </View>
    );
  }
  if (group.hasNew) {
    return <View style={[styles.dot, style]} accessibilityLabel="Nouveau" />;
  }
  return null;
};

/** Carte à tranche : la face s'enfonce de PRESS_DEPTH au toucher, comme les cartes 3D de l'app. */
export const ActionCardShell = ({
  group,
  height,
  onPress,
  style,
  innerStyle,
  children,
  accessibilityLabel,
}: {
  group: DailyActionGroup;
  height: number;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  innerStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  accessibilityLabel?: string;
}) => {
  const theme = ACTION_THEMES[group.type];
  const press = useRef(new Animated.Value(0)).current;

  const pressIn = () => Animated.spring(press, { toValue: 1, speed: 50, bounciness: 0, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(press, { toValue: 0, speed: 20, bounciness: 8, useNativeDriver: true }).start();
  const translateY = press.interpolate({ inputRange: [0, 1], outputRange: [0, PRESS_DEPTH] });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[{ height, borderRadius: 22, backgroundColor: theme.edge, paddingBottom: PRESS_DEPTH }, style]}
    >
      <Animated.View
        style={[styles.face, { backgroundColor: theme.background, transform: [{ translateY }] }, innerStyle]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  /* ---- Badge ---- */
  badge: {
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // La flèche est secondaire : fond blanc voilé pour qu'elle se fonde dans la carte.
  badgeSoft: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },

  /* ---- Statut ---- */
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.danger,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ---- Carte ---- */
  face: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
  },
});
