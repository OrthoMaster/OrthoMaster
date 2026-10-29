import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import { BookingMode } from '../../../services/v2/BookingService';
import { MODE_SHORT_LABELS } from '../bookingFormat';

/**
 * Seule définition des formats dans l'application (mobile et web) :
 * libellé, icône et couleurs. En présentiel = poignée de main, pour ne pas se confondre
 * avec l'icône de lieu (map-marker / location), réservée aux adresses.
 */
export const MODE_META: Record<
  BookingMode,
  { label: string; icon: 'video-outline' | 'handshake-outline'; color: string; soft: string; line: string }
> = {
  online: {
    label: MODE_SHORT_LABELS.online,
    icon: 'video-outline',
    color: Colors.lblueDark,
    soft: Colors.lblue3,
    line: Colors.lblue2,
  },
  onsite: {
    label: MODE_SHORT_LABELS.onsite,
    icon: 'handshake-outline',
    color: Colors.purpleDark,
    soft: Colors.purple3,
    line: Colors.purple2,
  },
};

/** En visio d'abord, puis en présentiel. */
export const sortModes = <T extends BookingMode>(modes: T[]): T[] =>
  [...modes].sort((a, b) => (a === b ? 0 : a === 'online' ? -1 : 1));

interface ModePillProps {
  mode: BookingMode;
  /** compact : listes serrées (cartes d'experts). */
  size?: 'default' | 'compact';
  style?: StyleProp<ViewStyle>;
}

/** Pastille d'un format : icône puis libellé, bleu en visio, violet en présentiel. */
export const ModePill: React.FC<ModePillProps> = ({ mode, size = 'default', style }) => {
  const meta = MODE_META[mode];
  const compact = size === 'compact';

  return (
    <View style={[styles.pill, compact && styles.pillCompact, { backgroundColor: meta.soft }, style]}>
      <MaterialCommunityIcons name={meta.icon} size={compact ? 13 : 15} color={meta.color} />
      <Text style={[styles.text, compact && styles.textCompact, { color: meta.color }]} numberOfLines={1}>
        {meta.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: Spacings.sm,
    paddingVertical: 3,
    borderRadius: 999,
  },
  pillCompact: {
    gap: 4,
    paddingHorizontal: Spacings.xs,
    paddingVertical: 2,
  },
  text: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
  },
  textCompact: {
    fontSize: 11,
  },
});
