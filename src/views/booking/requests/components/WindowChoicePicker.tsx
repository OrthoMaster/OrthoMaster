import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../../constants/Colors';
import Spacings from '../../../../../constants/Spacings';

import { BookingWindow, BookingWindowOption } from '../../../../services/v2/BookingService';
import { MONTHS, WEEKDAYS, formatLongDate, fromMinutes, toMinutes, weekdayIso } from '../../bookingDates';
import { tint } from '../../bookingPalette';
import { PERIOD_TEXT, consultationStarts, windowLabel } from '../../bookingWindows';

/** « Y-m-d|période » dans l'ordre du temps (matin avant après-midi). */
const byTime = (a: string, b: string) => a.replace('morning', '0').localeCompare(b.replace('morning', '0'));

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

interface WindowChoicePickerProps {
  kind: 'offer' | 'consultation';
  windows: BookingWindow[];
  /** Consultation : durée estimée. */
  durationMinutes?: number | null;
  /** Thème : demi-journées des créneaux (serveur), une option chacune. */
  options?: BookingWindowOption[];
  /** Consultation : « Y-m-d H:i ». */
  value?: string | null;
  onChange?: (value: string | null) => void;
  /** Thème : demi-journées retenues (« Y-m-d|période »), au plus blocksCount. */
  blocksCount?: number;
  selected?: string[];
  onSelect?: (values: string[]) => void;
  color: string;
  error?: boolean;
}

/**
 * Demande par créneaux (mobile et web) : l'expert choisit l'horaire exact pour accepter.
 *  - Consultation : un créneau, un jour, puis l'heure de début (− / +, par 30 min) ; la fin suit la durée.
 *  - Thème : même parcours (créneau, puis jour), puis matin / après-midi ; l'expert retient librement
 *    autant de demi-journées que le thème en compte, dans un ou plusieurs créneaux, consécutives ou non.
 * Les horaires déjà passés (ou demi-journées déjà prises) sont grisés.
 */
export const WindowChoicePicker: React.FC<WindowChoicePickerProps> = ({
  kind,
  windows,
  durationMinutes,
  options = [],
  value = null,
  onChange = () => {},
  blocksCount = 1,
  selected = [],
  onSelect = () => {},
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

  /* ---- Thème : demi-journées choisies librement ---- */
  const full = selected.length >= blocksCount;
  const usableOf = (pos: number) => options.some((o) => o.window === pos && o.available);
  const windowOptions = windowPos !== null ? options.filter((o) => o.window === windowPos) : [];
  const themeDays = [...new Set(windowOptions.map((o) => o.date))];
  const dayOptions = windowOptions.filter((o) => o.date === day);
  const toggle = (o: BookingWindowOption) => {
    if (selected.includes(o.value)) onSelect(selected.filter((v) => v !== o.value));
    else if (!full) onSelect([...selected, o.value].sort(byTime));
  };
  const pickThemeWindow = (w: BookingWindow) => {
    setWindowPos(w.position);
    const first = options.find((o) => o.window === w.position && o.available);
    setDay(first?.date ?? null);
  };
  const byValue = new Map(options.map((o) => [o.value, o]));

  return (
    <View style={styles.container}>
      {windows.map((w) => {
        const usable = usableOf(w.position);
        const on = w.position === windowPos;
        const count = selected.filter((v) => byValue.get(v)?.window === w.position).length;
        return (
          <TouchableOpacity
            key={w.position}
            style={[styles.window, on && { borderColor: color, backgroundColor: soft }, error && !on && !full && styles.windowError, !usable && styles.disabled]}
            onPress={() => pickThemeWindow(w)}
            disabled={!usable}
            accessibilityRole="radio"
            accessibilityState={{ selected: on, disabled: !usable }}
          >
            <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={18} color={usable ? color : Colors.subtext} />
            <Text style={[styles.windowText, !usable && styles.textOff]}>
              {windowLabel(w, year)}
              {!usable ? ' · passé' : ''}
            </Text>
            {count > 0 ? (
              <View style={[styles.badge, { backgroundColor: color }]}>
                <Text style={styles.badgeText}>{count}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}

      {windowPos !== null && themeDays.length > 0 ? (
        <View style={styles.pick}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
            {themeDays.map((d) => {
              const on = d === day;
              const [, m, n] = d.split('-').map(Number);
              const usable = windowOptions.some((o) => o.date === d && o.available);
              const picked = windowOptions.filter((o) => o.date === d && selected.includes(o.value)).length;
              return (
                <TouchableOpacity
                  key={d}
                  style={[styles.dayTile, on && { backgroundColor: color, borderColor: color }, !usable && styles.disabled]}
                  onPress={() => setDay(d)}
                  disabled={!usable}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on, disabled: !usable }}
                  accessibilityLabel={formatLongDate(d, year)}
                >
                  <Text style={[styles.dayWeek, on && styles.dayOn]}>{WEEKDAYS[weekdayIso(d)].slice(0, 3)}</Text>
                  <Text style={[styles.dayNumber, on && styles.dayOn]}>{n}</Text>
                  <Text style={[styles.dayMonth, on && styles.dayOn]}>{MONTHS[m - 1].slice(0, 3)}</Text>
                  {/* Demi-journées déjà retenues ce jour-là. */}
                  <View style={styles.dots}>
                    {[0, 1].map((i) => (
                      <View key={i} style={[styles.dot, { backgroundColor: i < picked ? (on ? Colors.white : color) : 'transparent' }]} />
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.periods}>
            {dayOptions.map((o) => {
              const on = selected.includes(o.value);
              const off = !o.available || (!on && full);
              return (
                <TouchableOpacity
                  key={o.value}
                  style={[styles.period, { borderColor: on ? color : Colors.border }, on && { backgroundColor: color }, off && styles.disabled]}
                  onPress={() => toggle(o)}
                  disabled={off}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on, disabled: off }}
                >
                  <Ionicons name={on ? 'checkbox' : 'square-outline'} size={18} color={on ? Colors.white : o.available ? color : Colors.subtext} />
                  <View style={styles.flex}>
                    <Text style={[styles.periodTitle, { color: on ? Colors.white : o.available ? Colors.text : Colors.subtext }]}>
                      {capitalize(PERIOD_TEXT[o.period])}
                    </Text>
                    <Text style={[styles.periodSub, { color: on ? Colors.white : Colors.subtext2 }]}>
                      {o.start_local} – {o.end_local}
                      {!o.available ? ' · indisponible' : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* ---- Demi-journées retenues, tous créneaux confondus ---- */}
      <View style={styles.summary}>
        <Text style={[styles.summaryCount, error && !full && { color: Colors.danger }]}>
          <Text style={{ color: full ? color : undefined }}>
            {selected.length} / {blocksCount}
          </Text>{' '}
          demi-journée{blocksCount > 1 ? 's' : ''} choisie{selected.length > 1 ? 's' : ''}
        </Text>
        {selected.length > 0 ? (
          <View style={styles.chips}>
            {selected.map((v) => {
              const o = byValue.get(v);
              if (!o) return null;
              const [, m, n] = o.date.split('-').map(Number);
              return (
                <TouchableOpacity
                  key={v}
                  style={[styles.chip, { borderColor: color, backgroundColor: soft }]}
                  onPress={() => toggle(o)}
                  accessibilityRole="button"
                  accessibilityLabel={`Retirer ${formatLongDate(o.date, year)} ${PERIOD_TEXT[o.period]}`}
                >
                  <Text style={[styles.chipText, { color: Colors.text }]}>
                    {WEEKDAYS[weekdayIso(o.date)].slice(0, 3)} {n} {MONTHS[m - 1].slice(0, 3)} · {PERIOD_TEXT[o.period]}
                  </Text>
                  <Ionicons name="close" size={14} color={color} />
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacings.sm,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  flex: {
    flex: 1,
  },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: Colors.white,
  },
  dots: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 2,
    height: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  periods: {
    flexDirection: 'row',
    gap: Spacings.xs,
  },
  period: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    padding: Spacings.sm,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: Colors.white,
  },
  periodTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  periodSub: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
  },
  summary: {
    gap: 6,
    marginTop: Spacings.xs,
  },
  summaryCount: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: Colors.subtext2,
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
});
