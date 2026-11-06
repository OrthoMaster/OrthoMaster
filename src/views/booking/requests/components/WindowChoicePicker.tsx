import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import Colors from '../../../../../constants/Colors';
import Spacings from '../../../../../constants/Spacings';

import { BookingPeriod, BookingWindow, BookingWindowOption } from '../../../../services/v2/BookingService';
import { PERIOD_ICONS, PERIOD_LABELS } from '../../experts/components/SlotPicker';
import { MONTHS, WEEKDAYS, formatLongDate, fromMinutes, toMinutes, weekdayIso } from '../../bookingDates';
import { tint } from '../../bookingPalette';
import { PERIOD_TEXT, consultationStarts, windowLabel } from '../../bookingWindows';

/** « Y-m-d|période » dans l'ordre du temps (matin avant après-midi). */
const byTime = (a: string, b: string) => a.replace('morning', '0').localeCompare(b.replace('morning', '0'));

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export interface PickerLocation {
  id: number;
  label: string;
  city: string;
}

const PERIODS: BookingPeriod[] = ['morning', 'afternoon'];
const STRIP_STEP = 180;

/**
 * Bandeau de jours défilant à l'horizontale, avec un chevron à chaque bout : il indique qu'il reste
 * des jours de ce côté (grisé sinon) et fait défiler d'un cran.
 */
const DayStrip: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => {
  const ref = useRef<ScrollView>(null);
  const [x, setX] = useState(0);
  const [content, setContent] = useState(0);
  const [width, setWidth] = useState(0);
  const canLeft = x > 2;
  const canRight = x + width < content - 2;
  // Tout tient à l'écran : pas de chevrons.
  const scrollable = width > 0 && content > width + 2;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setX(e.nativeEvent.contentOffset.x);
  const go = (dir: 1 | -1) => ref.current?.scrollTo({ x: Math.max(0, x + dir * STRIP_STEP), animated: true });

  const chevron = (dir: 1 | -1, on: boolean) => (
    <TouchableOpacity
      style={[styles.chevron, !on && styles.chevronOff]}
      onPress={() => go(dir)}
      disabled={!on}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={dir < 0 ? 'Jours précédents' : 'Jours suivants'}
    >
      <Ionicons name={dir < 0 ? 'chevron-back' : 'chevron-forward'} size={18} color={on ? color : Colors.border} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.strip}>
      {scrollable ? chevron(-1, canLeft) : null}
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.days}
        style={styles.flex}
        onScroll={onScroll}
        scrollEventThrottle={32}
        onContentSizeChange={(w) => setContent(w)}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      >
        {children}
      </ScrollView>
      {scrollable ? chevron(1, canRight) : null}
    </View>
  );
};

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
  /** Thème en présentiel : lieux de l'expert ; un lieu par demi-journée retenue. */
  locations?: PickerLocation[];
  blockLocations?: Record<string, number>;
  onBlockLocations?: (next: Record<string, number>) => void;
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
  locations,
  blockLocations = {},
  onBlockLocations = () => {},
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
            <DayStrip color={color}>
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
            </DayStrip>

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
  const withPlaces = !!locations?.length;
  const toggle = (o: BookingWindowOption) => {
    if (selected.includes(o.value)) {
      onSelect(selected.filter((v) => v !== o.value));
      if (withPlaces) {
        const { [o.value]: _, ...rest } = blockLocations;
        onBlockLocations(rest);
      }
    } else if (!full) {
      onSelect([...selected, o.value].sort(byTime));
      // Lieu proposé d'office : le seul lieu, ou le dernier choisi ; modifiable juste en dessous.
      if (withPlaces) {
        const last = selected.length ? blockLocations[selected[selected.length - 1]] : undefined;
        const preset = locations!.length === 1 ? locations![0].id : last;
        if (preset) onBlockLocations({ ...blockLocations, [o.value]: preset });
      }
    }
  };
  const placeOf = (v: string) => locations?.find((l) => l.id === blockLocations[v]);
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
          <DayStrip color={color}>
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
          </DayStrip>

          {/* Matin / après-midi du jour ouvert, comme sur l'écran Réserver ; en présentiel,
              le lieu de chaque demi-journée retenue se choisit aussitôt, dans sa case. */}
          {day ? <Text style={styles.panelDay}>{capitalize(formatLongDate(day, year))}</Text> : null}
          <View style={[styles.panel, { backgroundColor: soft }]}>
            {PERIODS.map((period) => {
              const o = dayOptions.find((x) => x.period === period);
              if (!o || !o.available) {
                return (
                  <View key={period} style={[styles.slot, styles.slotOff, { borderColor: Colors.border }]}>
                    <Text style={[styles.slotLabel, { color: Colors.subtext }]}>{PERIOD_LABELS[period]}</Text>
                    <Text style={[styles.slotHours, { color: Colors.subtext }]}>{o ? 'Indisponible' : 'Hors créneau'}</Text>
                  </View>
                );
              }
              const on = selected.includes(o.value);
              const off = !on && full;
              const place = placeOf(o.value);
              const missing = on && withPlaces && !place;
              return (
                <View
                  key={period}
                  style={[
                    styles.slot,
                    on ? { backgroundColor: color, borderColor: color } : { backgroundColor: Colors.white, borderColor: tint(color, 0.35) },
                    off && styles.disabled,
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => toggle(o)}
                    disabled={off}
                    activeOpacity={0.75}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on, disabled: off }}
                    accessibilityLabel={`${PERIOD_LABELS[period]} ${o.start_local} à ${o.end_local}`}
                  >
                    <View style={styles.slotHead}>
                      <MaterialCommunityIcons name={PERIOD_ICONS[period]} size={16} color={on ? Colors.white : color} />
                      <Text style={[styles.slotLabel, { color: on ? Colors.white : Colors.text }]}>{PERIOD_LABELS[period]}</Text>
                      {on ? <Ionicons name="checkmark-circle" size={16} color={Colors.white} /> : null}
                    </View>
                    <Text style={[styles.slotHours, { color: on ? Colors.white : Colors.subtext2 }]}>
                      {o.start_local} – {o.end_local}
                    </Text>
                  </TouchableOpacity>

                  {on && withPlaces ? (
                    <View style={styles.places}>
                      {locations!.map((l) => {
                        const picked = blockLocations[o.value] === l.id;
                        return (
                          <TouchableOpacity
                            key={l.id}
                            style={[styles.place, picked ? styles.placeOn : missing && error && styles.placeError]}
                            onPress={() => onBlockLocations({ ...blockLocations, [o.value]: l.id })}
                            accessibilityRole="radio"
                            accessibilityState={{ selected: picked }}
                            accessibilityLabel={`Lieu : ${l.label}, ${l.city}`}
                          >
                            <Ionicons name={picked ? 'location' : 'location-outline'} size={12} color={picked ? color : Colors.white} />
                            <Text style={[styles.placeText, { color: picked ? color : Colors.white }]} numberOfLines={1}>
                              {l.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
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
                    {withPlaces ? (
                      <Text style={{ color: placeOf(v) ? Colors.subtext2 : Colors.danger }}> · {placeOf(v)?.label ?? 'lieu ?'}</Text>
                    ) : null}
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
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  chevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chevronOff: {
    opacity: 0.5,
  },
  panelDay: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: Colors.text,
    marginBottom: -4,
  },
  // Comme l'écran Réserver : fond teinté, deux cases côte à côte.
  panel: {
    flexDirection: 'row',
    gap: Spacings.xs,
    padding: Spacings.xs,
    borderRadius: 14,
  },
  slot: {
    flex: 1,
    minHeight: 54,
    justifyContent: 'center',
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.xs,
    borderRadius: 10,
    borderWidth: 1,
  },
  slotOff: {
    borderStyle: 'dashed',
    opacity: 0.7,
    backgroundColor: Colors.white,
  },
  slotHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xxs,
  },
  slotLabel: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  slotHours: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    marginTop: 1,
  },
  places: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  place: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    maxWidth: '100%',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  placeOn: {
    backgroundColor: Colors.white,
    borderColor: Colors.white,
  },
  placeError: {
    borderColor: Colors.danger,
    borderWidth: 2,
  },
  placeText: {
    flexShrink: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
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
