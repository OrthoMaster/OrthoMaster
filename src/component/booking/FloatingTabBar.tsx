import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

export const FLOATING_TAB_BAR_HEIGHT = 66;

/** Écart entre la barre et le bord de l'écran quand il n'y a pas de zone sûre. */
const BAR_GAP = Spacings.sm;
const ITEM_HEIGHT = 50;
const ICON_SIZE = 26;

/**
 * Marge intérieure identique sur les quatre côtés : les cercles du bord sont
 * concentriques avec les arrondis de la barre.
 */
const BAR_BORDER = 1;
const BAR_PADDING = (FLOATING_TAB_BAR_HEIGHT - ITEM_HEIGHT) / 2 - BAR_BORDER;

/** Icône centrée dans un cercle de ITEM_HEIGHT ; l'onglet actif garde l'icône au même endroit. */
const ICON_INSET = (ITEM_HEIGHT - ICON_SIZE) / 2;

const ACTIVE_COLOR = Colors.white;
const INACTIVE_COLOR = Colors.subtext;

/** Couleur de la pastille si l'onglet ne fournit pas tabBarActiveTintColor. */
const DEFAULT_PILL_COLOR = Colors.lblueDark;

/** Même ressort pour l'onglet qui s'ouvre, celui qui se referme et ceux qui se décalent. */
const LAYOUT_TRANSITION = LinearTransition.springify().damping(18).stiffness(180);

/**
 * Espace à réserver en bas des écrans pour que le contenu ne passe pas sous la barre.
 * La version web renvoie 0 : la barre y est en haut, dans le flux.
 */
export const useFloatingTabBarInset = () => {
  const insets = useSafeAreaInsets();
  return FLOATING_TAB_BAR_HEIGHT + Math.max(insets.bottom, BAR_GAP) + BAR_GAP;
};

type FloatingTabBarProps = BottomTabBarProps & {
  /** Premier bouton : ce n'est pas un onglet mais la sortie vers les formations. */
  onExit: () => void;
};

/**
 * Icônes seules ; l'onglet actif s'élargit en pastille avec son libellé à droite de l'icône.
 * La barre épouse son contenu et reste centrée : sa largeur suit l'ouverture de l'onglet actif.
 */
export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({ state, descriptors, navigation, onExit }) => {
  const insets = useSafeAreaInsets();

  // Un écran peut masquer la barre (formulaire, clavier) via tabBarStyle: { display: 'none' }.
  const focusedOptions = descriptors[state.routes[state.index].key].options;
  if ((focusedOptions.tabBarStyle as { display?: string } | undefined)?.display === 'none') {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom: Math.max(insets.bottom, BAR_GAP) }]}>
      <Animated.View layout={LAYOUT_TRANSITION} style={styles.bar}>
        {/* Sortie : jamais active, donc jamais de libellé ; cercle distinct pour ne pas passer pour un onglet. */}
        <TouchableOpacity
          style={styles.exit}
          onPress={onExit}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Retour aux formations"
        >
          <Ionicons name="arrow-back" size={ICON_SIZE} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <View style={styles.tabs}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const focused = state.index === index;
            const color = focused ? ACTIVE_COLOR : INACTIVE_COLOR;
            const label = options.title ?? route.name;
            // Chaque onglet a sa couleur : la pastille reprend tabBarActiveTintColor.
            const pillColor = options.tabBarActiveTintColor ?? DEFAULT_PILL_COLOR;
            // Pastille rouge sans chiffre : signale qu'il y a quelque chose à traiter, sans compter.
            const hasBadge = !!options.tabBarBadge;

            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            return (
              <Animated.View
                key={route.key}
                layout={LAYOUT_TRANSITION}
                style={[styles.item, focused && { backgroundColor: pillColor }]}
              >
                <TouchableOpacity
                  style={[styles.itemTouch, focused && styles.itemTouchActive]}
                  onPress={onPress}
                  activeOpacity={0.7}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: focused }}
                  accessibilityLabel={label}
                >
                  <View>
                    {options.tabBarIcon?.({ focused, color, size: ICON_SIZE })}
                    {hasBadge && <View style={styles.badgeDot} />}
                  </View>

                  {focused && (
                    <Animated.Text
                      entering={FadeIn.duration(180).delay(60)}
                      exiting={FadeOut.duration(100)}
                      style={styles.label}
                      numberOfLines={1}
                    >
                      {label}
                    </Animated.Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  /* ---- Barre ---- */
  // Pleine largeur pour centrer la barre ; box-none laisse passer les touches à côté.
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: FLOATING_TAB_BAR_HEIGHT,
    padding: BAR_PADDING,
    borderRadius: FLOATING_TAB_BAR_HEIGHT / 2,
    backgroundColor: Colors.blackBackground,
    // Liseré clair : détache la barre sombre des fonds sombres. Déduit de BAR_PADDING.
    borderWidth: BAR_BORDER,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: Colors.blackBackground,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },

  /* ---- Sortie ---- */
  exit: {
    width: ITEM_HEIGHT,
    height: ITEM_HEIGHT,
    borderRadius: ITEM_HEIGHT / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Écart marqué : la sortie se lit comme un bouton à part, pas comme un onglet de plus.
  divider: {
    width: 1,
    height: 28,
    marginHorizontal: Spacings.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },

  /* ---- Onglets ---- */
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  item: {
    height: ITEM_HEIGHT,
    borderRadius: ITEM_HEIGHT / 2,
  },
  // Inactif : cercle de ITEM_HEIGHT, icône au centre.
  itemTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    height: '100%',
    minWidth: ITEM_HEIGHT,
    paddingHorizontal: ICON_INSET,
  },
  // Actif : même retrait à gauche pour que l'icône ne bouge pas, plus d'air à droite du libellé.
  itemTouchActive: {
    paddingRight: Spacings.md,
  },
  label: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: ACTIVE_COLOR,
  },

  /* ---- Badge ---- */
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -3,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: Colors.danger,
    // Liseré de la couleur de la barre : la pastille se détache de l'icône.
    borderWidth: 2,
    borderColor: Colors.blackBackground,
  },
});