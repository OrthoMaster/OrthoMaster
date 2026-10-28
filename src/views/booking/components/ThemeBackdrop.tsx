import React, { useId } from 'react';
import { StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

import { ExpertTheme } from '../expertTheme';

/**
 * Fond de la page vitrine : halo radial bg2 → bg centré à 70 % / 45 %
 * (CSS : radial-gradient(ellipse 60% 70% at 70% 45%, var(--bg2), var(--bg) 70%)).
 * expo-linear-gradient ne fait pas de radial : SVG à la place.
 */
export const ThemeBackdrop = ({ theme, style }: { theme: ExpertTheme; style?: StyleProp<ViewStyle> }) => {
  // Identifiant unique : deux fonds dans le même arbre ne partagent pas le même dégradé.
  const id = `halo${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <Svg style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Defs>
        <RadialGradient id={id} cx="70%" cy="45%" rx="60%" ry="70%" fx="70%" fy="45%" gradientUnits="objectBoundingBox">
          <Stop offset="0" stopColor={theme.bg2} />
          <Stop offset="0.7" stopColor={theme.bg} />
          <Stop offset="1" stopColor={theme.bg} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={theme.bg} />
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
};