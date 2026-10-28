import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import Colors from '../../../../../constants/Colors';
import Spacings from '../../../../../constants/Spacings';

import { BookingPeriod, ExpertGridDate } from '../../../../services/v2/BookingService';
import { MONTHS, WEEKDAYS_SHORT, formatLongDate, monthMatrix } from '../../bookingDates';

const PERIODS: BookingPeriod[] = ['morning', 'afternoon'];
const PERIOD_LABELS: Record<BookingPeriod, string> = { morning: 'Matin', afternoon: 'Après-midi' };
const PERIOD_ICONS: Record<BookingPeriod, 'weather-sunset-up' | 'weather-sunny'> = {
  morning: 'weather-sunset-up',
  afternoon: 'weather-sunny',
};

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

interface OfferDatesPickerProps {
  /** Demi-journées proposables (grille ouverte, dates fermées exclues). */
  available: ExpertGridDate[];
  /** « Y-m-d|période » choisies. */
  value: string[];
  onChange: (next: string[]) => void;
  today: string;
  /** Présentiel : le nom du lieu s'affiche sous chaque demi-journée. */
  showLocation?: boolean;
  /** Lieu attribué dans le formulaire à une demi-journée de la semaine encore sans lieu. */
  assignedLabel?: (date: string, period: BookingPeriod) => string | null;
  /** Couleurs du mode (bleu en ligne, violet en présentiel) : forte, fond doux, filet. */
  color?: string;
  soft?: string;
  line?: string;
}

/**
 * Calendrier « Dates précises » : un jour proposable porte un point ; le toucher ouvre,
 * sous le calendrier, ses deux demi-journées à cocher. Les dates choisies sont listées
 * dessous et se retirent d'un toucher.
 */
export const OfferDatesPicker: React.FC<OfferDatesPickerProps> = ({
  available,
  value,
  onChange,
  today,
  showLocation,
  assignedLabel,
  color = Colors.lblueDark,
  soft = Colors.lblue3,
  line = Colors.lblue2,
}) => {
  // Index « date » => demi-journées proposables avec leur lieu.
  const byDate = useMemo(() => {
    const map: Record<string, Partial<Record<BookingPeriod, ExpertGridDate>>> = {};
    for (const slot of available) {
      map[slot.date] = { ...map[slot.date], [slot.period]: slot };
    }
    return map;
  }, [available]);

  const selected = useMemo(() => new Set(value), [value]);
  const firstAvailable = available[0]?.date ?? today;
  const lastAvailable = available[available.length - 1]?.date ?? today;

  const [focus, setFocus] = useState<string | null>(null);
  const [month, setMonth] = useState(() => {
    const [y, m] = (value[0] ?? firstAvailable).split('-').map(Number);
    return { year: y, month: m };
  });

  const monthIndex = (year: number, m: number) => year * 12 + (m - 1);
  const [minY, minM] = today.split('-').map(Number);
  const [maxY, maxM] = lastAvailable.split('-').map(Number);
  const canPrev = monthIndex(month.year, month.month) > monthIndex(minY, minM);
  const canNext = monthIndex(month.year, month.month) < monthIndex(maxY, maxM);

  const changeMonth = (delta: number) =>
    setMonth(({ year, month: m }) => {
      const index = monthIndex(year, m) + delta;
      return { year: Math.floor(index / 12), month: (index % 12) + 1 };
    });

  const toggle = (key: string) =>
    onChange(selected.has(key) ? value.filter((k) => k !== key) : [...value, key].sort());

  const labelOf = (date: string, period: BookingPeriod) =>
    byDate[date]?.[period]?.location_label ?? assignedLabel?.(date, period) ?? null;

  const sortedValue = [...value].sort();
  const focusSlots = focus ? PERIODS.filter((p) => byDate[focus]?.[p]) : [];

  return (
    <View style={styles.container}>
      {/* ---- Mois ---- */}
      <View style={styles.monthNav}>
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: soft }, !canPrev && styles.navButtonDisabled]}
          onPress={() => changeMonth(-1)}
          disabled={!canPrev}
          accessibilityLabel="Mois précédent"
        >
          <Ionicons name="chevron-back" size={18} color={canPrev ? color : Colors.disabledBackground} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {capitalize(MONTHS[month.month - 1])} {month.year}
        </Text>
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: soft }, !canNext && styles.navButtonDisabled]}
          onPress={() => changeMonth(1)}
          disabled={!canNext}
          accessibilityLabel="Mois suivant"
        >
          <Ionicons name="chevron-forward" size={18} color={canNext ? color : Colors.disabledBackground} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekHeader}>
        {WEEKDAYS_SHORT.slice(1).map((label, i) => (
          <Text key={i} style={styles.weekHeaderText}>{label}</Text>
        ))}
      </View>

      {monthMatrix(month.year, month.month).map((week, w) => (
        <View key={w} style={styles.week}>
          {week.map((date, d) => {
            if (!date) return <View key={d} style={styles.day} />;

            const open = !!byDate[date];
            const picked = PERIODS.filter((p) => selected.has(`${date}|${p}`)).length;
            const focused = focus === date;

            return (
              <TouchableOpacity
                key={d}
                style={[styles.day, focused && { backgroundColor: soft }]}
                onPress={() => setFocus(date)}
                disabled={!open}
                activeOpacity={0.6}
                accessibilityLabel={formatLongDate(date)}
              >
                <View style={[styles.dayNumberWrap, picked > 0 && { backgroundColor: color }]}>
                  <Text style={[styles.dayNumber, !open && styles.dayClosed, picked > 0 && styles.dayNumberPicked]}>
                    {Number(date.slice(8))}
                  </Text>
                </View>
                {/* Un point par demi-journée proposable ; plein si choisie. */}
                <View style={styles.dots}>
                  {open &&
                    PERIODS.filter((p) => byDate[date]?.[p]).map((p) => (
                      <View
                        key={p}
                        style={[styles.dot, { borderColor: color }, selected.has(`${date}|${p}`) && { backgroundColor: color }]}
                      />
                    ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {/* ---- Demi-journées du jour touché ---- */}
      {focus ? (
        <View style={styles.focusBox}>
          <Text style={styles.focusTitle}>{capitalize(formatLongDate(focus))}</Text>
          <View style={styles.focusSlots}>
            {focusSlots.map((period) => {
              const key = `${focus}|${period}`;
              const on = selected.has(key);
              const place = showLocation ? labelOf(focus, period) : null;
              return (
                <TouchableOpacity
                  key={period}
                  style={[styles.slot, { borderColor: line }, on && { borderColor: color, backgroundColor: color }]}
                  onPress={() => toggle(key)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                >
                  <MaterialCommunityIcons name={PERIOD_ICONS[period]} size={18} color={on ? Colors.white : color} />
                  <View style={styles.flex}>
                    <Text style={[styles.slotLabel, { color }, on && styles.slotLabelOn]}>{PERIOD_LABELS[period]}</Text>
                    {showLocation && (
                      <Text style={[styles.slotPlace, on && styles.slotPlaceOn]} numberOfLines={1}>
                        {place ?? 'Adresse à choisir'}
                      </Text>
                    )}
                  </View>
                  {on && <Ionicons name="checkmark" size={18} color={Colors.white} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : (
        <Text style={styles.hint}>Touchez un jour marqué d'un point pour choisir ses demi-journées.</Text>
      )}

      {/* ---- Dates choisies ---- */}
      {sortedValue.length > 0 && (
        <View style={styles.chosen}>
          <Text style={styles.chosenTitle}>
            {sortedValue.length} demi-journée{sortedValue.length > 1 ? 's' : ''} choisie{sortedValue.length > 1 ? 's' : ''}
          </Text>
          <View style={styles.chips}>
            {sortedValue.map((key) => {
              const [date, period] = key.split('|') as [string, BookingPeriod];
              const stillOpen = !!byDate[date]?.[period];
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.chip, { backgroundColor: soft }, !stillOpen && styles.chipWarn]}
                  onPress={() => toggle(key)}
                  accessibilityLabel={`Retirer ${formatLongDate(date)} ${PERIOD_LABELS[period]}`}
                >
                  <Text style={[styles.chipText, { color }, !stillOpen && styles.chipTextWarn]}>
                    {date.slice(8)}/{date.slice(5, 7)} {period === 'morning' ? 'matin' : 'ap.-midi'}
                  </Text>
                  <Ionicons name="close" size={14} color={stillOpen ? color : Colors.danger} />
                </TouchableOpacity>
              );
            })}
          </View>
          {sortedValue.some((key) => {
            const [date, period] = key.split('|') as [string, BookingPeriod];
            return !byDate[date]?.[period];
          }) && <Text style={styles.warnText}>En rouge : plus disponible dans votre semaine type, à retirer.</Text>}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  /* ---- Structure ---- */
  container: {
    gap: Spacings.xs,
  },
  flex: {
    flex: 1,
  },
  hint: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.subtext2,
    marginTop: Spacings.xs,
  },

  /* ---- Mois ---- */
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: {
    backgroundColor: Colors.grayLight,
  },
  monthTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: Colors.text,
  },

  /* ---- Grille ---- */
  weekHeader: {
    flexDirection: 'row',
    marginTop: Spacings.xs,
  },
  weekHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    color: Colors.subtext,
  },
  week: {
    flexDirection: 'row',
  },
  day: {
    flex: 1,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: 10,
  },
  dayNumberWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: Colors.text,
  },
  dayNumberPicked: {
    color: Colors.white,
  },
  dayClosed: {
    color: Colors.disabledBackground,
  },
  dots: {
    flexDirection: 'row',
    gap: 3,
    height: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: Colors.lblueDark,
  },

  /* ---- Jour touché ---- */
  focusBox: {
    marginTop: Spacings.sm,
    padding: Spacings.sm,
    borderRadius: 12,
    backgroundColor: Colors.grayLight,
    gap: Spacings.xs,
  },
  focusTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.text,
  },
  focusSlots: {
    flexDirection: 'row',
    gap: Spacings.xs,
  },
  slot: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    padding: Spacings.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.lblue2,
    backgroundColor: Colors.white,
  },
  slotLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: Colors.lblueDark,
  },
  slotLabelOn: {
    color: Colors.white,
  },
  slotPlace: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: Colors.subtext2,
  },
  slotPlaceOn: {
    color: 'rgba(255, 255, 255, 0.85)',
  },

  /* ---- Dates choisies ---- */
  chosen: {
    marginTop: Spacings.sm,
    gap: Spacings.xs,
  },
  chosenTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: Colors.text,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: Spacings.sm,
    paddingRight: Spacings.xs,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: Colors.lblue3,
  },
  chipWarn: {
    backgroundColor: Colors.dangerBackground,
  },
  chipText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: Colors.lblueDark,
  },
  chipTextWarn: {
    color: Colors.danger,
  },
  warnText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.danger,
  },
});