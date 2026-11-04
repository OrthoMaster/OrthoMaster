import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../../constants/Colors';
import Spacings from '../../../../../constants/Spacings';

import { BookingWindow, BookingWindowOption } from '../../../../services/v2/BookingService';
import { MONTHS, WEEKDAYS, formatLongDate, fromMinutes, toMinutes, weekdayIso } from '../../bookingDates';
import { tint } from '../../bookingPalette';
import { PERIOD_TEXT, consultationStarts, windowLabel } from '../../bookingWindows';

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

interface WindowChoicePickerProps {
  kind: 'offer' | 'consultation';
  windows: BookingWindow[];
  /** Consultation : durée estimée. */
  durationMinutes?: number | null;
  /** Thème : premières demi-journées possibles (serveur). */
  options?: BookingWindowOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  color: string;
  error?: boolean;
}

/**
 * Demande par créneaux (mobile et web) : l'expert choisit l'horaire exact pour accepter.
 *  - Consultation : un créneau, un jour, puis l'heure de début (− / +, par 30 min) ; la fin suit la durée.
 *  - Thème : la première demi-journée (les suivantes s'enchaînent) parmi celles proposées.
 * Les horaires déjà passés (ou demi-journées déjà prises) sont grisés.
 */
export const WindowChoicePicker: React.FC<WindowChoicePickerProps> = ({
  kind,
  windows,
  durationMinutes,
  options = [],
  value,
  onChange,
  color,
  error,
}) => {
  const year = new Date().getFullYear();
  const soft = tint(color, 0.12);
  const minutes = durationMinutes ?? 30;

  /* ---- Consultation ---- */
  const [windowPos, setWindowPos] = useState<number | null>(null);
  const [day, setDay] = useState<string | null>(null);

  // Heures de début encore possibles, par créneau.
  const startsByWindow = useMemo(() => {
    const now = Date.now();
    const map: Record<number, { date: string; time: string }[]> = {};
    for (const w of windows) {
      map[w.position] = consultationStarts(w, minutes).filter((s) => new Date(`${s.date}T${s.time}:00`).getTime() > now);
    }
    return map;
  }, [windows, minutes]);

  const starts = windowPos !== null ? startsByWindow[windowPos] ?? [] : [];
  const days = [...new Set(starts.map((s) => s.date))];
  const dayStarts = starts.filter((s) => s.date === day);
  const current = value && kind === 'consultation' ? value.split(' ')[1] : null;
  const index = dayStarts.findIndex((s) => s.time === current);

  // Un jour choisi : première heure possible d'office.
  useEffect(() => {
    if (kind !== 'consultation' || !day) return;
    if (!dayStarts.some((s) => s.time === current)) onChange(dayStarts[0] ? `${day} ${dayStarts[0].time}` : null);
  }, [day, windowPos]);

  const pickWindow = (w: BookingWindow) => {
    setWindowPos(w.position);
    const first = (startsByWindow[w.position] ?? [])[0];
    setDay(first?.date ?? null);
    onChange(first ? `${first.date} ${first.time}` : null);
  };

  const step = (dir: 1 | -1) => {
    const next = dayStarts[index + dir];
    if (next) onChange(`${next.date} ${next.time}`);
  };

  if (kind === 'consultation') {
    return (
      <View style={styles.container}>
        {windows.map((w) => {
          const usable = (startsByWindow[w.position] ?? []).length > 0;
          const on = w.position === windowPos;
          return (
            <TouchableOpacity
              key={w.position}
              style={[styles.window, on && { borderColor: color, backgroundColor: soft }, error && !on && styles.windowError, !usable && styles.disabled]}
              onPress={() => pickWindow(w)}
              disabled={!usable}
              accessibilityRole="radio"
              accessibilityState={{ selected: on, disabled: !usable }}
            >
              <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={18} color={usable ? color : Colors.subtext} />
              <Text style={[styles.windowText, !usable && styles.textOff]}>
                {windowLabel(w, year)}
                {!usable ? ' · passé' : ''}
              </Text>
            </TouchableOpacity>
          );
        })}

        {windowPos !== null && days.length > 0 ? (
          <View style={styles.pick}>
            {/* Jours du créneau, comme le bandeau de l'Agenda : lettre du jour, numéro, mois. */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
              {days.map((d) => {
                const on = d === day;
                const [, m, n] = d.split('-').map(Number);
                return (
                  <TouchableOpacity
                    key={d}
                    style={[styles.dayTile, on && { backgroundColor: color, borderColor: color }]}
                    onPress={() => setDay(d)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={formatLongDate(d, year)}
                  >
                    <Text style={[styles.dayWeek, on && styles.dayOn]}>{WEEKDAYS[weekdayIso(d)].slice(0, 3)}</Text>
                    <Text style={[styles.dayNumber, on && styles.dayOn]}>{n}</Text>
                    <Text style={[styles.dayMonth, on && styles.dayOn]}>{MONTHS[m - 1].slice(0, 3)}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.stepRow}>
              <View style={[styles.stepper, { backgroundColor: soft }]}>
                <TouchableOpacity
                  style={[styles.stepButton, index <= 0 && styles.stepOff]}
                  onPress={() => step(-1)}
                  disabled={index <= 0}
                  hitSlop={6}
                  accessibilityLabel="Plus tôt"
                >
                  <Ionicons name="remove" size={20} color={index > 0 ? color : Colors.border} />
                </TouchableOpacity>
                <Text style={styles.stepValue}>{current ?? '--:--'}</Text>
                <TouchableOpacity
                  style={[styles.stepButton, (index < 0 || index >= dayStarts.length - 1) && styles.stepOff]}
                  onPress={() => step(1)}
                  disabled={index < 0 || index >= dayStarts.length - 1}
                  hitSlop={6}
                  accessibilityLabel="Plus tard"
                >
                  <Ionicons name="add" size={20} color={index >= 0 && index < dayStarts.length - 1 ? color : Colors.border} />
                </TouchableOpacity>
              </View>
              {current ? (
                <Text style={styles.endText}>
                  → {fromMinutes((toMinutes(current) + minutes) % 1440)}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}
      </View>
    );
  }

  /* ---- Thème : première demi-journée ---- */
  return (
    <View style={styles.container}>
      {windows.map((w) => {
        const list = options.filter((o) => o.window === w.position);
        return (
          <View key={w.position} style={styles.themeWindow}>
            <Text style={[styles.themeWindowTitle, w.past && styles.textOff]}>
              Créneau {w.position} · {windowLabel(w, year)}
            </Text>
            <View style={styles.chips}>
              {list.map((o) => {
                const on = o.value === value;
                const sameDay = o.date === o.end_date;
                return (
                  <TouchableOpacity
                    key={o.value}
                    style={[
                      styles.option,
                      { borderColor: o.available ? color : Colors.border },
                      on && { backgroundColor: color },
                      !o.available && styles.disabled,
                    ]}
                    onPress={() => onChange(o.value)}
                    disabled={!o.available}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on, disabled: !o.available }}
                  >
                    <Text style={[styles.optionTitle, { color: on ? Colors.white : o.available ? Colors.text : Colors.subtext }]}>
                      {capitalize(formatLongDate(o.date, year))} {PERIOD_TEXT[o.period]}
                    </Text>
                    <Text style={[styles.optionSub, { color: on ? Colors.white : Colors.subtext2 }]}>
                      {o.start_local} → {sameDay ? '' : `${formatLongDate(o.end_date, year)} `}
                      {o.end_local}
                      {!o.available ? ' · indisponible' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacings.xs,
  },
  window: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    padding: Spacings.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  windowError: {
    borderColor: Colors.danger,
  },
  windowText: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.text,
  },
  disabled: {
    opacity: 0.5,
  },
  textOff: {
    color: Colors.subtext,
  },
  pick: {
    gap: Spacings.sm,
    marginTop: Spacings.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: Spacings.sm,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
  },
  days: {
    gap: 6,
  },
  dayTile: {
    width: 54,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  dayWeek: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    color: Colors.subtext2,
  },
  dayNumber: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    lineHeight: 24,
    color: Colors.text,
  },
  dayMonth: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: Colors.subtext2,
  },
  dayOn: {
    color: Colors.white,
  },
  dayLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.text,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    padding: 4,
    borderRadius: 14,
  },
  stepButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  stepOff: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  stepValue: {
    minWidth: 70,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: Colors.text,
  },
  endText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: Colors.subtext2,
  },
  themeWindow: {
    gap: 6,
  },
  themeWindowTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: Colors.subtext2,
  },
  option: {
    paddingHorizontal: Spacings.sm,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: Colors.white,
  },
  optionTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
  },
  optionSub: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
  },
});
