import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

/** La salle s'ouvre un peu avant l'heure : le temps de régler micro et caméra. */
export const JOIN_BEFORE_MINUTES = 15;

interface JoinVisioButtonProps {
  startAt: string | null;
  endAt: string | null;
  /** Lien Meet ; null tant que l'intégration Google Meet n'est pas en place. */
  url: string | null;
  color?: string;
  /** Version réduite, pour une ligne de liste. */
  compact?: boolean;
}

type JoinState = 'ended' | 'no-link' | 'early' | 'open';

const stateAt = (startAt: string | null, endAt: string | null, url: string | null): JoinState => {
  const now = Date.now();
  if (endAt && new Date(endAt).getTime() <= now) return 'ended';
  if (!url) return 'no-link';
  if (startAt && new Date(startAt).getTime() - JOIN_BEFORE_MINUTES * 60000 > now) return 'early';
  return 'open';
};

/**
 * Bouton « Rejoindre la visio » d'une demi-journée.
 * Actif de 15 min avant le début jusqu'à la fin ; avant, il annonce quand il le sera.
 * Réévalué toutes les 30 s : il s'active de lui-même pendant que l'écran est ouvert.
 */
export const JoinVisioButton: React.FC<JoinVisioButtonProps> = ({ startAt, endAt, url, color = Colors.lblue, compact }) => {
  const [state, setState] = useState<JoinState>(() => stateAt(startAt, endAt, url));

  useEffect(() => {
    setState(stateAt(startAt, endAt, url));
    const timer = setInterval(() => setState(stateAt(startAt, endAt, url)), 30000);
    return () => clearInterval(timer);
  }, [startAt, endAt, url]);

  if (state === 'ended') return null;

  const open = state === 'open';
  const hint =
    state === 'no-link'
      ? 'Lien de la visio bientôt disponible'
      : state === 'early'
        ? `Accessible ${JOIN_BEFORE_MINUTES} min avant le début`
        : null;

  return (
    <View style={compact ? styles.wrapCompact : styles.wrap}>
      <TouchableOpacity
        style={[
          styles.button,
          compact && styles.buttonCompact,
          { backgroundColor: open ? color : Colors.disabledBackground },
        ]}
        onPress={() => url && Linking.openURL(url)}
        disabled={!open}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityState={{ disabled: !open }}
      >
        <Ionicons name="videocam" size={compact ? 15 : 18} color={Colors.white} />
        <Text style={[styles.text, compact && styles.textCompact]}>Rejoindre la visio</Text>
      </TouchableOpacity>
      {hint ? <Text style={[styles.hint, compact && styles.hintCompact]}>{hint}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: Spacings.xxs,
  },
  wrapCompact: {
    alignItems: 'flex-start',
    gap: 2,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.xs,
    height: 46,
    borderRadius: 12,
  },
  buttonCompact: {
    height: 32,
    paddingHorizontal: Spacings.sm,
    borderRadius: 9,
  },
  text: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: Colors.white,
  },
  textCompact: {
    fontSize: 12,
  },
  hint: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.subtext,
    textAlign: 'center',
  },
  hintCompact: {
    fontSize: 11,
    textAlign: 'left',
  },
});