import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, LayoutAnimation, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import Colors from '../../../../../constants/Colors';
import Spacings from '../../../../../constants/Spacings';

import { BookingBlock, BookingMode, BookingPeriod, getExpertAvailability } from '../../../../services/v2/BookingService';
import { notify } from '../../bookingActions';
import { blocksLabel } from '../../bookingFormat';
import { MONTHS, WEEKDAYS_SHORT, formatLongDate, isoDate, monthMatrix } from '../../bookingDates';
import { tint } from '../../bookingPalette';
import { ExpertTheme } from '../../expertTheme';

export const PERIOD_LABELS: Record<BookingPeriod, string> = { morning: 'Matin', afternoon: 'Après-midi' };

/** Icônes (MaterialCommunityIcons) des demi-journées, partagées par le calendrier et le récapitulatif. */
export const PERIOD_ICONS: Record<BookingPeriod, 'weather-sunset-up' | 'weather-sunny'> = {
  morning: 'weather-sunset-up',
  afternoon: 'weather-sunny',
};

export interface SelectedBlock extends BookingBlock {
  date: string;
}

export type SlotSelection = Record<string, SelectedBlock>;

export const blockKey = (date: string, period: BookingPeriod) => `${date}|${period}`;

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** « Cabinet A · Lyon » : nom court du lieu, ville si elle apporte quelque chose. */
export const placeLabel = (location: { label?: string | null; city?: string | null }) =>
  [location.label, location.city].filter(Boolean).join(' · ');

/** Fuseau de l'appareil, pour prévenir quand il diffère de celui de l'expert. */
const deviceTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {
    return null;
  }
};

interface SlotPickerProps {
  expertId: number;
  /** Offre et mode : le calendrier suit celui de l'offre dans ce mode. */
  offerId: number;
  mode: BookingMode;
  /** Bornes de réservation de l'expert (Y-m-d). */
  firstDate: string;
  lastDate: string;
  /** Nombre de demi-journées demandé par le thème. */
  required: number;
  theme: ExpertTheme;
  selection: SlotSelection;
  onChange: (next: SlotSelection) => void;
}

const PERIODS: BookingPeriod[] = ['morning', 'afternoon'];

/** Ouverture du choix sous la semaine : animation courte, la grille ne « saute » pas. */
const animateLayout = () => {
  try {
    LayoutAnimation.configureNext(LayoutAnimation.create(180, 'easeInEaseOut', 'opacity'));
  } catch (e) { }
};

/**
 * Calendrier des demi-journées libres d'un expert, aux couleurs de sa palette.
 * Toucher un jour ouvre Matin / Après-midi juste sous sa semaine, une flèche pointant le jour :
 * le choix se fait sous le doigt, sans descendre chercher les créneaux.
 * Chargé mois par mois dans ses bornes de réservation ; la sélection est contrôlée par l'écran.
 */
export const SlotPicker: React.FC<SlotPickerProps> = ({
  expertId,
  offerId,
  mode,
  firstDate,
  lastDate,
  required,
  theme,
  selection,
  onChange,
}) => {
  const [firstY, firstM] = firstDate.split('-').map(Number);
  const [lastY, lastM] = lastDate.split('-').map(Number);
  const [month, setMonth] = useState({ year: firstY, month: firstM });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const selectedCount = Object.keys(selection).length;

  /* ---- Couleurs dérivées de la palette ---- */
  const c = {
    soft: tint(theme.primary, 0.12),
    chosen: tint(theme.primary, 0.55),
    dot: tint(theme.primary, 0.4),
  };

  /* ---- Disponibilités du mois ---- */

  const range = useMemo(() => {
    const lastDay = new Date(Date.UTC(month.year, month.month, 0)).getUTCDate();
    const from = [isoDate(month.year, month.month, 1), firstDate].sort()[1];
    const to = [isoDate(month.year, month.month, lastDay), lastDate].sort()[0];
    return from <= to ? { from, to } : null;
  }, [month, firstDate, lastDate]);

  const { data: calendar, isFetching } = useQuery({
    queryKey: ['booking', 'availability', expertId, offerId, mode, range?.from, range?.to],
    queryFn: () => getExpertAvailability(expertId, { offer_id: offerId, mode, ...range! }),
    enabled: !!range,
  });

  const blocksByDate = useMemo(() => {
    const map: Record<string, BookingBlock[]> = {};
    for (const day of calendar?.days ?? []) {
      map[day.date] = day.blocks;
    }
    return map;
  }, [calendar]);

  // Mois chargé : on ouvre d'office le premier jour libre, pour montrer tout de suite des créneaux.
  useEffect(() => {
    if (!selectedDate && calendar?.days.length) setSelectedDate(calendar.days[0].date);
  }, [calendar]);

  /* ---- Navigation ---- */

  const monthIndex = (y: number, m: number) => y * 12 + m;
  const canPrev = monthIndex(month.year, month.month) > monthIndex(firstY, firstM);
  const canNext = monthIndex(month.year, month.month) < monthIndex(lastY, lastM);

  const openDay = (date: string) => {
    animateLayout();
    setSelectedDate((current) => (current === date ? null : date));
  };

  const changeMonth = (delta: number) => {
    setSelectedDate(null);
    setMonth((current) => {
      const index = current.year * 12 + (current.month - 1) + delta;
      return { year: Math.floor(index / 12), month: (index % 12) + 1 };
    });
  };

  /* ---- Sélection ---- */

  const toggleBlock = (date: string, block: BookingBlock) => {
    const key = blockKey(date, block.period);

    if (selection[key]) {
      const next = { ...selection };
      delete next[key];
      onChange(next);
      return;
    }

    if (selectedCount >= required) {
      notify('Sélection complète', `Ce thème compte ${blocksLabel(required)}. Retirez-en une pour en choisir une autre.`);
      return;
    }

    onChange({ ...selection, [key]: { ...block, date } });
  };

  const tz = deviceTimezone();
  const showTzNotice = !!calendar && !!tz && tz !== calendar.timezone;

  return (
    <View style={styles.wrap}>
      {/* ---- Calendrier ---- */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.line }]}>
        <View style={styles.monthNav}>
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: canPrev ? c.soft : 'transparent' }]}
            onPress={() => changeMonth(-1)}
            disabled={!canPrev}
            accessibilityLabel="Mois précédent"
          >
            <Ionicons name="chevron-back" size={20} color={canPrev ? theme.primary : theme.line} />
          </TouchableOpacity>

          <View style={styles.monthTitleWrap}>
            <Text style={[styles.monthTitle, { color: theme.ink }]}>
              {capitalize(MONTHS[month.month - 1])} {month.year}
            </Text>
            {isFetching && <ActivityIndicator size="small" color={theme.primary} />}
          </View>

          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: canNext ? c.soft : 'transparent' }]}
            onPress={() => changeMonth(1)}
            disabled={!canNext}
            accessibilityLabel="Mois suivant"
          >
            <Ionicons name="chevron-forward" size={20} color={canNext ? theme.primary : theme.line} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekHeader}>
          {WEEKDAYS_SHORT.slice(1).map((label, i) => (
            <Text key={i} style={[styles.weekHeaderText, { color: theme.muted }]}>
              {label}
            </Text>
          ))}
        </View>

        {monthMatrix(month.year, month.month).map((week, w) => {
          const openColumn = selectedDate ? week.indexOf(selectedDate) : -1;
          const openBlocks = openColumn >= 0 ? blocksByDate[selectedDate!] ?? [] : [];

          return (
            <Fragment key={w}>
              <View style={styles.week}>
                {week.map((date, d) => {
                  if (!date) return <View key={d} style={styles.day} />;

                  const blocks = blocksByDate[date];
                  const available = !!blocks && blocks.length > 0;
                  const active = selectedDate === date;
                  const hasChosen = PERIODS.some((p) => selection[blockKey(date, p)]);

                  const background = active ? theme.primary : hasChosen ? c.chosen : available ? c.soft : 'transparent';
                  const color = active || hasChosen ? theme.onPrimary : available ? theme.primary : theme.line;

                  return (
                    <TouchableOpacity
                      key={d}
                      style={styles.day}
                      onPress={() => openDay(date)}
                      disabled={!available}
                      activeOpacity={0.6}
                      accessibilityLabel={formatLongDate(date)}
                      accessibilityState={{ disabled: !available, selected: active }}
                    >
                      <View style={[styles.dayCircle, { backgroundColor: background }]}>
                        <Text style={[styles.dayNumber, { color }]}>{Number(date.slice(8))}</Text>
                      </View>
                      {available && (
                        <View style={styles.dots}>
                          {blocks.map((block) => (
                            <View
                              key={block.period}
                              style={[
                                styles.dot,
                                { backgroundColor: selection[blockKey(date, block.period)] ? theme.primary : c.dot },
                              ]}
                            />
                          ))}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ---- Choix de la demi-journée, sous la semaine du jour ouvert ---- */}
              {openColumn >= 0 && (
                <View style={[styles.panel, { backgroundColor: c.soft }]}>
                  <View
                    style={[
                      styles.caret,
                      { backgroundColor: c.soft, left: `${((openColumn + 0.5) / 7) * 100}%` },
                    ]}
                  />
                  {PERIODS.map((period) => {
                    const block = openBlocks.find((b) => b.period === period);
                    const chosen = !!block && !!selection[blockKey(selectedDate!, period)];

                    if (!block) {
                      return (
                        <View key={period} style={[styles.slot, styles.slotOff, { borderColor: theme.line }]}>
                          <Text style={[styles.slotLabel, { color: theme.muted }]}>{PERIOD_LABELS[period]}</Text>
                          <Text style={[styles.slotHours, { color: theme.muted }]}>Indisponible</Text>
                        </View>
                      );
                    }

                    return (
                      <TouchableOpacity
                        key={period}
                        style={[
                          styles.slot,
                          chosen
                            ? { backgroundColor: theme.primary, borderColor: theme.primary }
                            : { backgroundColor: theme.card, borderColor: tint(theme.primary, 0.35) },
                        ]}
                        onPress={() => toggleBlock(selectedDate!, block)}
                        activeOpacity={0.75}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: chosen }}
                        accessibilityLabel={`${PERIOD_LABELS[period]} ${block.start_local} à ${block.end_local}`}
                      >
                        <View style={styles.slotHead}>
                          <MaterialCommunityIcons
                            name={PERIOD_ICONS[period]}
                            size={16}
                            color={chosen ? theme.onPrimary : theme.primary}
                          />
                          <Text style={[styles.slotLabel, { color: chosen ? theme.onPrimary : theme.ink }]}>
                            {PERIOD_LABELS[period]}
                          </Text>
                          {chosen && <Ionicons name="checkmark-circle" size={16} color={theme.onPrimary} />}
                        </View>
                        <Text style={[styles.slotHours, { color: chosen ? theme.onPrimary : theme.muted }]}>
                          {block.start_local} – {block.end_local}
                        </Text>
                        {/* Présentiel : chaque demi-journée peut se tenir dans un lieu différent. */}
                        {block.location ? (
                          <View style={styles.slotPlace}>
                            <Ionicons
                              name="location-outline"
                              size={12}
                              color={chosen ? theme.onPrimary : theme.primary}
                            />
                            <Text
                              style={[styles.slotPlaceText, { color: chosen ? theme.onPrimary : theme.ink }]}
                              numberOfLines={2}
                            >
                              {placeLabel(block.location)}
                            </Text>
                          </View>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </Fragment>
          );
        })}

        {!isFetching && calendar && calendar.days.length === 0 && (
          <Text style={[styles.noSlot, { color: theme.muted }]}>
            {mode === 'onsite'
              ? 'Aucune demi-journée libre sur place ce mois-ci.'
              : 'Aucune demi-journée libre ce mois-ci.'}
          </Text>
        )}
      </View>

      {showTzNotice && (
        <View style={styles.notice}>
          <Ionicons name="globe-outline" size={16} color={theme.muted} />
          <Text style={[styles.noticeText, { color: theme.muted }]}>
            Horaires indiqués à l'heure de l'expert ({calendar!.timezone}).
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: Spacings.md,
  },
  flex: {
    flex: 1,
  },
  card: {
    padding: Spacings.md,
    borderRadius: 20,
    borderWidth: 1,
  },

  /* ---- Navigation ---- */
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  monthTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 17,
    letterSpacing: -0.3,
  },

  /* ---- Grille ---- */
  weekHeader: {
    flexDirection: 'row',
    marginTop: Spacings.md,
    marginBottom: Spacings.xxs,
  },
  weekHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
  },
  week: {
    flexDirection: 'row',
  },
  day: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  dots: {
    flexDirection: 'row',
    gap: 3,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  noSlot: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    textAlign: 'center',
    marginTop: Spacings.sm,
  },

  /* ---- Choix sous la semaine ---- */
  panel: {
    flexDirection: 'row',
    gap: Spacings.xs,
    padding: Spacings.xs,
    marginTop: Spacings.xs,
    marginBottom: Spacings.xs,
    borderRadius: 14,
  },
  // Losange tourné : pointe vers le jour ouvert.
  caret: {
    position: 'absolute',
    top: -5,
    width: 12,
    height: 12,
    marginLeft: -6,
    transform: [{ rotate: '45deg' }],
    borderRadius: 2,
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
  slotPlace: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 3,
    marginTop: 3,
  },
  slotPlaceText: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    lineHeight: 15,
  },

  /* ---- Fuseau ---- */
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  noticeText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
  },
});