import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import { BookingWindow } from '../../../services/v2/BookingService';
import { PERIOD_TEXT, windowLabel } from '../bookingWindows';
import { formatCardDay } from '../bookingDates';

interface WindowsListProps {
  windows: BookingWindow[];
  color?: string;
  /** Titre au-dessus de la liste (cartes : plus petit). */
  title?: string | null;
  compact?: boolean;
}

/**
 * Créneaux proposés hors calendrier (mobile et web), dans l'ordre ; un créneau dont plus aucun
 * horaire n'est possible est grisé et marqué « passé ».
 */
export const WindowsList: React.FC<WindowsListProps> = ({ windows, color = Colors.lblueDark, title, compact }) => {
  if (!windows.length) return null;
  const year = new Date().getFullYear();

  return (
    <View style={styles.container}>
      {title !== null ? (
        <Text style={[styles.title, compact && styles.titleCompact]}>
          {title ?? (windows.length > 1 ? 'Créneaux proposés' : 'Créneau proposé')}
        </Text>
      ) : null}
      {windows.map((w) => (
        <View key={w.position} style={[styles.row, w.past && styles.rowPast]}>
          <Ionicons name="calendar-outline" size={compact ? 14 : 16} color={w.past ? Colors.subtext : color} />
          {compact ? (
            // Cartes : « Jeu 12 Nov 09:00 → Ven 13 Nov 12:00 », heures en gris.
            <Text style={[styles.text, styles.textCompact, w.past && styles.textPast]}>
              {formatCardDay(w.start_date)} <Text style={styles.time}>{timeOf(w, 'start')}</Text>
              {w.start_date === w.end_date ? (
                <Text style={styles.time}> – {timeOf(w, 'end')}</Text>
              ) : (
                <>
                  {' → '}
                  {formatCardDay(w.end_date)} <Text style={styles.time}>{timeOf(w, 'end')}</Text>
                </>
              )}
              {w.past ? ' · passé' : ''}
            </Text>
          ) : (
            <Text style={[styles.text, w.past && styles.textPast]}>
              {windowLabel(w, year)}
              {w.past ? ' · passé' : ''}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
};

/** Heure (consultation) ou demi-journée (thème) d'un bout du créneau. */
const timeOf = (w: BookingWindow, side: 'start' | 'end') =>
  side === 'start'
    ? w.start_time ?? (w.start_period ? PERIOD_TEXT[w.start_period] : '')
    : w.end_time ?? (w.end_period ? PERIOD_TEXT[w.end_period] : '');

const styles = StyleSheet.create({
  time: {
    color: Colors.subtext2,
    fontFamily: 'Poppins-Regular',
  },
  container: {
    gap: 4,
  },
  title: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: Colors.subtext2,
    marginBottom: 2,
  },
  titleCompact: {
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.xs,
  },
  rowPast: {
    opacity: 0.6,
  },
  text: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
  },
  textCompact: {
    fontSize: 13,
    lineHeight: 18,
  },
  textPast: {
    color: Colors.subtext,
    textDecorationLine: 'line-through',
  },
});
