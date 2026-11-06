import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import { BookingKind, BookingPeriod } from '../../../services/v2/BookingService';
import { CONSULT_COLOR, CONSULT_SOFT, durationText } from '../bookingKinds';
import { PERIOD_LABELS } from '../experts/components/SlotPicker';

/** Couleur du type de rendez-vous : violet (Consultation), bleu (Thème). */
export const kindColor = (kind?: BookingKind) => (kind === 'consultation' ? CONSULT_COLOR : Colors.lblueDark);

/**
 * Pastilles v3 (mobile et web) : « Consultation · 1 h » ou « Thème · 2 demi-journées »
 * (quand blocksCount est donné), et « Hors calendrier », sur les cartes et fiches.
 */
export const KindTags: React.FC<{
  kind?: BookingKind;
  durationMinutes?: number | null;
  /** Thème : nombre de demi-journées ; affiche la pastille « Thème ». */
  blocksCount?: number | null;
  /** Pastille « Thème » sans le nombre de demi-journées. */
  themeOnly?: boolean;
  offCalendar?: boolean;
  /** Pastilles placées après celles-ci, sur la même ligne (format : En visio / En présentiel…). */
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}> = ({ kind, durationMinutes, blocksCount, themeOnly, offCalendar, children, style }) => {
  const theme = kind !== 'consultation' && (!!blocksCount || !!themeOnly);
  if (kind !== 'consultation' && !offCalendar && !theme && !children) return null;

  return (
    <View style={[styles.row, style]}>
      {theme ? (
        <View style={[styles.tag, { backgroundColor: Colors.lblue3 }]}>
          <Ionicons name="bulb-outline" size={12} color={Colors.lblueDark} />
          <Text style={[styles.text, { color: Colors.lblueDark }]}>
            {themeOnly ? 'Thème' : `Thème · ${blocksCount} demi-journée${blocksCount! > 1 ? 's' : ''}`}
          </Text>
        </View>
      ) : null}
      {kind === 'consultation' ? (
        <View style={[styles.tag, { backgroundColor: CONSULT_SOFT }]}>
          <Ionicons name="chatbubbles-outline" size={12} color={CONSULT_COLOR} />
          <Text style={[styles.text, { color: CONSULT_COLOR }]}>
            Consultation{durationMinutes ? ` · ${durationText(durationMinutes)}` : ''}
          </Text>
        </View>
      ) : null}
      {offCalendar ? (
        <View style={[styles.tag, { backgroundColor: Colors.warningBackground }]}>
          <Ionicons name="calendar-clear-outline" size={12} color={Colors.warning} />
          <Text style={[styles.text, { color: '#B26A00' }]}>Hors calendrier</Text>
        </View>
      ) : null}
      {children}
    </View>
  );
};

/** Horaire d'un créneau : « Matin · 09:00 – 12:00 », ou « 14:00 – 15:00 » pour une consultation. */
export const blockHours = (
  block: { period: BookingPeriod; start_local: string; end_local: string },
  kind?: BookingKind
) =>
  kind === 'consultation'
    ? `${block.start_local} – ${block.end_local}`
    : `${PERIOD_LABELS[block.period]} · ${block.start_local} – ${block.end_local}`;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacings.xxs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacings.xs,
    paddingVertical: 2,
    borderRadius: 8,
  },
  text: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
  },
});
