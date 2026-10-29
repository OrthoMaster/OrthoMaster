import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';
import { withAlpha } from '../../views/booking/bookingPalette';

/**
 * Version WEB de la barre d'onglets de l'espace rendez-vous : même barre flottante que
 * sur mobile (FloatingTabBar.tsx), fixée en bas et centrée dans la zone de contenu
 * (à droite de la barre latérale), par-dessus la page.
 *
 * Différence avec le mobile : pas de bouton de sortie, on entre et on sort par
 * l'entrée « Rendez-vous » de la barre latérale.
 */

export const FLOATING_TAB_BAR_HEIGHT = 66;

/** Écart entre la barre et le bas de la page. */
const BAR_GAP = Spacings.md;
const ITEM_HEIGHT = 50;
const ICON_SIZE = 26;

const BAR_BORDER = 1;
const BAR_PADDING = (FLOATING_TAB_BAR_HEIGHT - ITEM_HEIGHT) / 2 - BAR_BORDER;
const ICON_INSET = (ITEM_HEIGHT - ICON_SIZE) / 2;

const ACTIVE_COLOR = Colors.white;
const INACTIVE_COLOR = Colors.subtext;
const DEFAULT_PILL_COLOR = Colors.lblueDark;

const LAYOUT_TRANSITION = LinearTransition.springify().damping(18).stiffness(180);

const TAB_GAP = Spacings.xs;

/** Largeur de la barre latérale commune (AppTab.web) : la zone de contenu est le reste. */
const SIDEBAR_WIDTH = 200;
const LABEL_CHAR_WIDTH = 8.5;

const estimateBarWidth = (tabCount: number, label: string | null) => {
  const tabs = tabCount * ITEM_HEIGHT + (tabCount - 1) * TAB_GAP;
  const labelWidth = label ? Spacings.xs + label.length * LABEL_CHAR_WIDTH + Spacings.md - ICON_INSET : 0;
  return tabs + labelWidth + (BAR_PADDING + BAR_BORDER) * 2;
};

/**
 * Espace à réserver en bas des écrans pour que la fin du contenu ne reste pas sous la barre.
 */
export const useFloatingTabBarInset = () => FLOATING_TAB_BAR_HEIGHT + BAR_GAP * 2;

type FloatingTabBarProps = BottomTabBarProps & {
  /** Gardé pour la compatibilité avec le mobile ; pas de bouton de sortie sur le web. */
  onExit: () => void;
};

export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({ state, descriptors, navigation }) => {
  const { width: windowWidth } = useWindowDimensions();

  // Un écran peut masquer la barre (formulaire) via tabBarStyle: { display: 'none' }.
  const focusedOptions = descriptors[state.routes[state.index].key].options;
  if ((focusedOptions.tabBarStyle as { display?: string } | undefined)?.display === 'none') {
    return null;
  }

  // Libellé de l'onglet actif seulement s'il tient dans la zone de contenu (toujours vrai sur ordinateur).
  const available = windowWidth - SIDEBAR_WIDTH - BAR_GAP * 2;
  const focusedLabel = focusedOptions.title ?? state.routes[state.index].name;
  const showLabel = estimateBarWidth(state.routes.length, focusedLabel) <= available;

  return (
    // Pleine largeur de la zone de contenu pour centrer la barre ; box-none laisse passer les clics à côté.
    <View pointerEvents="box-none" style={styles.wrapper}>
      <Animated.View layout={LAYOUT_TRANSITION} style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const color = focused ? ACTIVE_COLOR : INACTIVE_COLOR;
          const label = options.title ?? route.name;
          const pillColor = options.tabBarActiveTintColor ?? DEFAULT_PILL_COLOR;
          const badge = options.tabBarBadge;
          const badgeText =
            typeof badge === 'number' ? (badge > 9 ? '9+' : String(badge)) : typeof badge === 'string' ? badge : null;
          const badgeRing = focused ? pillColor : Colors.blackBackground;

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
              <Pressable
                style={({ hovered }: any) => [
                  styles.itemTouch,
                  focused && showLabel && styles.itemTouchActive,
                  hovered && !focused && { backgroundColor: withAlpha(pillColor, 0.35) },
                ]}
                onPress={onPress}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={label}
              >
                <View>
                  {options.tabBarIcon?.({ focused, color, size: ICON_SIZE })}
                  {badge ? (
                    badgeText ? (
                      <View style={[styles.badgeCount, { borderColor: badgeRing }]}>
                        <Text style={styles.badgeCountText}>{badgeText}</Text>
                      </View>
                    ) : (
                      <View style={[styles.badgeDot, { borderColor: badgeRing }]} />
                    )
                  ) : null}
                </View>

                {focused && showLabel && (
                  <Animated.Text
                    entering={FadeIn.duration(180).delay(60)}
                    exiting={FadeOut.duration(100)}
                    style={styles.label}
                    numberOfLines={1}
                  >
                    {label}
                  </Animated.Text>
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  /* ---- Barre ---- */
  // Fixée en bas de la zone de contenu, au-dessus des écrans.
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: BAR_GAP,
    alignItems: 'center',
    zIndex: 10,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: TAB_GAP,
    height: FLOATING_TAB_BAR_HEIGHT,
    padding: BAR_PADDING,
    borderRadius: FLOATING_TAB_BAR_HEIGHT / 2,
    backgroundColor: Colors.blackBackground,
    borderWidth: BAR_BORDER,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: Colors.blackBackground,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },

  /* ---- Onglets ---- */
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
    borderRadius: ITEM_HEIGHT / 2,
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
    borderWidth: 2,
    borderColor: Colors.blackBackground,
  },
  badgeCount: {
    position: 'absolute',
    top: -7,
    right: -10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: Colors.danger,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCountText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    lineHeight: 13,
    color: Colors.white,
  },
});
