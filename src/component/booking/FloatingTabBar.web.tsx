import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

export const FLOATING_TAB_BAR_HEIGHT = 0;

/** La barre est en haut et dans le flux : aucun espace à réserver en bas. */
export const useFloatingTabBarInset = () => 0;

type FloatingTabBarProps = BottomTabBarProps & {
  onExit: () => void;
};

/**
 * Sur le web, une barre flottante en bas d'un écran large paraît déplacée à côté de la
 * barre latérale : onglets en pill segmented en haut du contenu, comme dans le CMS.
 */
export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({ state, descriptors, navigation, onExit }) => {
  const focusedOptions = descriptors[state.routes[state.index].key].options;
  if ((focusedOptions.tabBarStyle as { display?: string } | undefined)?.display === 'none') {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={onExit}
        style={({ hovered }: any) => [styles.exit, hovered && styles.exitHovered]}
        accessibilityRole="button"
      >
        <Ionicons name="arrow-back" size={16} color={Colors.lgreenDark} />
        <Text style={styles.exitText}>Formations</Text>
      </Pressable>

      <View style={styles.segmented}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const color = focused ? Colors.white : Colors.subtext;
          const badge = options.tabBarBadge;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={({ hovered }: any) => [
                styles.tab,
                hovered && !focused && styles.tabHovered,
                focused && styles.tabActive,
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
            >
              {options.tabBarIcon?.({ focused, color, size: 16 })}
              <Text style={[styles.tabText, { color }]}>{options.title ?? route.name}</Text>
              {badge !== undefined && badge !== null && badge !== 0 && (
                <View style={[styles.count, focused && styles.countActive]}>
                  <Text style={[styles.countText, { color }]}>{badge}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  /* ---- Barre ---- */
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.md,
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  /* ---- Sortie ---- */
  exit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xxs,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.xs,
    borderRadius: 9,
  },
  exitHovered: {
    backgroundColor: Colors.lgreen3,
  },
  exitText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: Colors.lgreenDark,
  },

  /* ---- Pill segmented ---- */
  segmented: {
    flexDirection: 'row',
    gap: Spacings.xxs,
    padding: Spacings.xxs,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: Spacings.md,
    paddingVertical: Spacings.xs,
    borderRadius: 9,
  },
  tabHovered: {
    backgroundColor: Colors.lblue3,
  },
  tabActive: {
    backgroundColor: Colors.lblueDark,
  },
  tabText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
  },
  count: {
    paddingHorizontal: Spacings.xs,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.07)',
  },
  countActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  countText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
  },
});