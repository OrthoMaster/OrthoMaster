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

/** « Cabinet Lyon · 69002 Lyon » : nom du lieu, code postal et ville. */
export const bookedPlaceLabel = (location?: {
  label?: string | null;
  postal_code?: string | null;
  city?: string | null;
} | null) =>
  location ? [location.label, [location.postal_code, location.city].filter(Boolean).join(' ')].filter(Boolean).join(' · ') : '';

/**
 * Format d'un rendez-vous sur les cartes de liste : pastille, puis en présentiel le lieu
 * de la demi-journée mise en avant (nom, code postal et ville).
 */
export const ModeLine: React.FC<{
  mode: BookingMode;
  location?: { label?: string | null; postal_code?: string | null; city?: string | null } | null;
  style?: StyleProp<ViewStyle>;
}> = ({ mode, location, style }) => {
  const place = mode === 'onsite' ? bookedPlaceLabel(location) : '';
  return (
    <View style={[lineStyles.row, style]}>
      <ModePill mode={mode} size="compact" />
      {place ? (
        <View style={lineStyles.place}>
          <MaterialCommunityIcons name="map-marker-outline" size={14} color={Colors.subtext} />
          <Text style={lineStyles.placeText} numberOfLines={1}>
            {place}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const lineStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  place: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    minWidth: 0,
  },
  placeText: {
    flexShrink: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.subtext2,
  },
});
