import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';
import { withAlpha } from '../../views/booking/bookingPalette';

export const FLOATING_TAB_BAR_HEIGHT = 0;

/** La barre est en haut et dans le flux : aucun espace à réserver en bas. */
export const useFloatingTabBarInset = () => 0;

type FloatingTabBarProps = BottomTabBarProps & {
  onExit: () => void;
};

/**
 * Sur le web, une barre flottante en bas d'un écran large paraît déplacée à côté de la
 * barre latérale : onglets en pill segmented en haut du contenu, comme dans le CMS.
 * L'espace s'ouvre depuis l'entrée « Rendez-vous » de la barre latérale : pas de bouton de sortie.
 *
 * Dans un bandeau bleu ciel (couleur de l'entrée Rendez-vous) ; rail blanc et onglets
 * en gélule comme sur mobile, chaque onglet actif prenant sa propre couleur (tabBarActiveTintColor).
 */
export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({ state, descriptors, navigation }) => {
  const focusedOptions = descriptors[state.routes[state.index].key].options;
  if ((focusedOptions.tabBarStyle as { display?: string } | undefined)?.display === 'none') {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      {/* Pas de bouton « Formations » : sur le web, on entre et on sort par la barre latérale. */}

      <View style={styles.segmented}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          // Même couleur par onglet que sur mobile ; bleu foncé si l'onglet n'en donne pas.
          const tint = options.tabBarActiveTintColor ?? Colors.lblueDark;
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
                hovered && !focused && { backgroundColor: withAlpha(tint, 0.12) },
                focused && { backgroundColor: tint },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
            >
              {options.tabBarIcon?.({ focused, color, size: 16 })}
              <Text style={[styles.tabText, { color }]}>{options.title ?? route.name}</Text>
              {badge !== undefined && badge !== null && badge !== 0 && (
                <View style={[styles.count, focused && styles.countActive]}>
                  <Text style={styles.countText}>{badge}</Text>
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
  // Bandeau bleu ciel : on reconnaît l'espace Rendez-vous de la barre latérale.
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.md,
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.md,
    backgroundColor: Colors.lblue3,
    borderBottomWidth: 1,
    borderBottomColor: withAlpha(Colors.lblue2, 0.6),
  },


  /* ---- Pill segmented ---- */
  // Rail blanc en gélule, détaché du bandeau par une ombre douce.
  segmented: {
    flexDirection: 'row',
    gap: Spacings.xxs,
    padding: 5,
    borderRadius: 999,
    backgroundColor: Colors.white,
    shadowColor: Colors.lblueDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
  },
  // Gélule : arrondi complet à gauche et à droite, comme les onglets mobiles.
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 38,
    paddingHorizontal: Spacings.md,
    borderRadius: 999,
  },
  tabText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
  },
  // Pastille rouge comme sur mobile ; sur l'onglet actif, elle se fond dans sa couleur.
  count: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  countText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: Colors.white,
  },
});