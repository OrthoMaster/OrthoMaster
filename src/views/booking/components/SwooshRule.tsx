import React, { useId } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';

interface SwooshRuleProps {
  color: string;
  width: number;
  style?: StyleProp<ViewStyle>;
}

/** Épaisseur au centre, là où le trait est le plus marqué. */
const HEIGHT = 4;

/**
 * Filet symétrique en fuseau : épais et plein au centre, il s'amincit en courbe et
 * s'efface progressivement vers les deux extrémités.
 */
export const SwooshRule = ({ color, width, style }: SwooshRuleProps) => {
  const id = `swoosh${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const mid = HEIGHT / 2;
  const center = width / 2;

  // Deux courbes (haut et bas) de pointe à pointe ; les points de contrôle hors de la
  // boîte font atteindre au trait exactement 0 et HEIGHT au centre.
  const d = [
    `M0 ${mid}`,
    `C${center * 0.5} ${mid} ${center * 0.6} 0 ${center} 0`,
    `C${center * 1.4} 0 ${center * 1.5} ${mid} ${width} ${mid}`,
    `C${center * 1.5} ${mid} ${center * 1.4} ${HEIGHT} ${center} ${HEIGHT}`,
    `C${center * 0.6} ${HEIGHT} ${center * 0.5} ${mid} 0 ${mid}`,
    'Z',
  ].join(' ');

  return (
    <Svg width={width} height={HEIGHT} style={style} pointerEvents="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={color} stopOpacity={0} />
          <Stop offset="0.3" stopColor={color} stopOpacity={0.55} />
          <Stop offset="0.5" stopColor={color} stopOpacity={1} />
          <Stop offset="0.7" stopColor={color} stopOpacity={0.55} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={d} fill={`url(#${id})`} />
    </Svg>
  );
};