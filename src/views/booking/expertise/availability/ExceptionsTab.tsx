import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../../constants/Colors';
import Spacings from '../../../../../constants/Spacings';

import {
  BookingExceptionType,
  BookingPeriod,
  ExpertAvailabilityException,
  ExpertBookingSetup,
  addMyAvailabilityExceptions,
  deleteMyAvailabilityException,
} from '../../../../services/v2/BookingService';
import { BookingActionSheet, BookingSheetAction } from '../../components/BookingActionSheet';
import {
  MONTHS,
  WEEKDAYS_SHORT,
  addDays,
  diffDays,
  formatLongDate,
  formatShortDate,
  monthMatrix,
  todayIn,
  weekdayIso,
} from '../../bookingDates';
import { notify } from '../../bookingActions';

type PeriodState = 'open' | 'closed' | 'blocked' | 'added';

const PERIODS: BookingPeriod[] = ['morning', 'afternoon'];
const PERIOD_LABELS: Record<BookingPeriod, string> = { morning: 'matin', afternoon: 'après-midi' };
/** Fermeture d'une période (congés) : masquée pour l'instant, le code reste prêt. */
const RANGE_ENABLED = false;

const STATE_COLORS: Record<PeriodState, string> = {
  open: Colors.lblue,
  added: Colors.success,
  blocked: Colors.danger,
  closed: 'transparent',
};

const STATE_LABELS: Record<PeriodState, string> = {
  open: 'ouvert',
  added: 'ouvert exceptionnellement',
  blocked: 'fermé',
  closed: 'fermé',
};

/** Plages consécutives de même nature, pour qu'un congé de 15 jours tienne sur une ligne. */
interface ExceptionGroup {
  from: string;
  to: string;
  period: BookingPeriod | null;
  type: BookingExceptionType;
  ids: number[];
}

const groupExceptions = (exceptions: ExpertAvailabilityException[]): ExceptionGroup[] => {
  const sorted = [...exceptions].sort((a, b) =>
    a.date === b.date ? String(a.period).localeCompare(String(b.period)) : a.date.localeCompare(b.date)
  );
  const groups: ExceptionGroup[] = [];

  for (const exception of sorted) {
    const last = groups.find(
      (g) => g.period === exception.period && g.type === exception.type && addDays(g.to, 1) === exception.date
    );
    if (last) {
      last.to = exception.date;
      last.ids.push(exception.id);
    } else {
      groups.push({ from: exception.date, to: exception.date, period: exception.period, type: exception.type, ids: [exception.id] });
    }
  }
  return groups.sort((a, b) => a.from.localeCompare(b.from));
};

interface ExceptionsTabProps {
  setup: ExpertBookingSetup;
  apply: (next: ExpertBookingSetup) => void;
  bottomInset: number;
}

export const ExceptionsTab: React.FC<ExceptionsTabProps> = ({ setup, apply, bottomInset }) => {
  const today = todayIn(setup.settings.resolved.timezone);
  const [todayYear, todayMonth] = today.split('-').map(Number);

  const [month, setMonth] = useState({ year: todayYear, month: todayMonth });
  const [rangeMode, setRangeMode] = useState(false);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sheet, setSheet] = useState<{ title: string; subtitle?: string; actions: BookingSheetAction[] } | null>(null);

  /* ---- État d'une demi-journée : exception de la période > journée entière > semaine type ---- */

  const exceptionsByDate = useMemo(() => {
    const map: Record<string, Partial<Record<BookingPeriod | 'day', ExpertAvailabilityException>>> = {};
    for (const exception of setup.exceptions) {
      map[exception.date] = { ...map[exception.date], [exception.period ?? 'day']: exception };
    }
    return map;
  }, [setup.exceptions]);

  const ruleOpen = (date: string, period: BookingPeriod) => {
    const weekday = weekdayIso(date);
    return setup.rules.some(
      (r) =>
        r.weekday === weekday &&
        r.period === period &&
        (!r.valid_from || r.valid_from <= date) &&
        (!r.valid_until || r.valid_until >= date)
    );
  };

  const periodState = (date: string, period: BookingPeriod): PeriodState => {
    const day = exceptionsByDate[date];
    const exception = day?.[period] ?? day?.day;
    if (exception) return exception.type === 'block' ? 'blocked' : 'added';
    return ruleOpen(date, period) ? 'open' : 'closed';
  };

  /* ---- Écritures ---- */

  const run = async (action: () => Promise<{ ok: boolean; data?: ExpertBookingSetup; message?: string | null }>) => {
    setPending(true);
    const result = await action();
    setPending(false);
    if (result.ok && result.data) {
      apply(result.data);
    } else if (!result.ok) {
      notify('Enregistrement impossible', result.message ?? 'Réessayez dans un instant.');
    }
  };

  const addException = (from: string, to: string | null, period: BookingPeriod | null, type: BookingExceptionType) =>
    run(() => addMyAvailabilityExceptions({ date_from: from, date_to: to, period, type }) as any);

  const removeExceptions = (ids: number[]) =>
    run(async () => {
      let last: any = { ok: true };
      for (const id of ids) {
        last = await deleteMyAvailabilityException(id);
        if (!last.ok) break;
      }
      return last;
    });

  /* ---- Calendrier ---- */

  const changeMonth = (delta: number) => {
    setMonth(({ year, month: m }) => {
      const index = year * 12 + (m - 1) + delta;
      return { year: Math.floor(index / 12), month: (index % 12) + 1 };
    });
  };

  const atCurrentMonth = month.year === todayYear && month.month === todayMonth;

  const openDaySheet = (date: string) => {
    const states = { morning: periodState(date, 'morning'), afternoon: periodState(date, 'afternoon') };
    const available = (p: BookingPeriod) => states[p] === 'open' || states[p] === 'added';
    const dayExceptions = Object.values(exceptionsByDate[date] ?? {}).filter(Boolean) as ExpertAvailabilityException[];

    const actions: BookingSheetAction[] = [];

    if (available('morning') && available('afternoon')) {
      actions.push({
        key: 'close-day',
        label: 'Fermer toute la journée',
        icon: 'calendar-remove-outline',
        tone: 'danger',
        onPress: () => addException(date, null, null, 'block'),
      });
    }
    for (const period of PERIODS) {
      if (available(period)) {
        actions.push({
          key: `close-${period}`,
          label: `Fermer ${period === 'morning' ? 'le matin' : "l'après-midi"}`,
          icon: 'close-circle-outline',
          tone: 'danger',
          onPress: () => addException(date, null, period, 'block'),
        });
      }
    }
    // Ouvrir seulement ce que la semaine type ferme ; une fermeture d'exception se rétablit plutôt.
    for (const period of PERIODS) {
      if (states[period] === 'closed') {
        actions.push({
          key: `open-${period}`,
          label: `Ouvrir ${period === 'morning' ? 'le matin' : "l'après-midi"} exceptionnellement`,
          icon: 'plus-circle-outline',
          tone: 'success',
          onPress: () => addException(date, null, period, 'add'),
        });
      }
    }
    if (dayExceptions.length > 0) {
      actions.push({
        key: 'restore',
        label: 'Rétablir la semaine type',
        icon: 'restore',
        onPress: () => removeExceptions(dayExceptions.map((e) => e.id)),
      });
    }

    const title = formatLongDate(date, todayYear);
    setSheet({
      title: title.charAt(0).toUpperCase() + title.slice(1),
      subtitle: `Matin ${STATE_LABELS[states.morning]} · Après-midi ${STATE_LABELS[states.afternoon]}`,
      actions,
    });
  };

  const openRangeSheet = (from: string, to: string) => {
    const days = diffDays(from, to) + 1;
    if (days > setup.limits.max_exception_days) {
      notify('Période trop longue', `Une période ne peut pas dépasser ${setup.limits.max_exception_days} jours.`);
      return;
    }

    const endRange = () => {
      setRangeMode(false);
      setRangeStart(null);
    };

    setSheet({
      title: `Du ${formatShortDate(from)} au ${formatShortDate(to, true)}`,
      subtitle: `${days} jours`,
      actions: [
        {
          key: 'range-day',
          label: 'Fermer les journées entières',
          icon: 'calendar-remove-outline',
          tone: 'danger',
          onPress: () => { endRange(); addException(from, to, null, 'block'); },
        },
        {
          key: 'range-morning',
          label: 'Fermer les matins',
          icon: 'close-circle-outline',
          tone: 'danger',
          onPress: () => { endRange(); addException(from, to, 'morning', 'block'); },
        },
        {
          key: 'range-afternoon',
          label: 'Fermer les après-midi',
          icon: 'close-circle-outline',
          tone: 'danger',
          onPress: () => { endRange(); addException(from, to, 'afternoon', 'block'); },
        },
      ],
    });
  };

  const onDayPress = (date: string) => {
    if (pending || date < today) return;

    if (!rangeMode) {
      openDaySheet(date);
      return;
    }
    if (!rangeStart) {
      setRangeStart(date);
      return;
    }
    const [from, to] = rangeStart <= date ? [rangeStart, date] : [date, rangeStart];
    openRangeSheet(from, to);
  };

  const groups = groupExceptions(setup.exceptions);

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: bottomInset + Spacings.md }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        {/* ---- Navigation ---- */}
        <View style={styles.monthNav}>
          <TouchableOpacity
            style={[styles.navButton, atCurrentMonth && styles.navButtonDisabled]}
            onPress={() => changeMonth(-1)}
            disabled={atCurrentMonth}
            accessibilityLabel="Mois précédent"
          >
            <Ionicons name="chevron-back" size={20} color={atCurrentMonth ? Colors.disabledBackground : Colors.lblueDark} />
          </TouchableOpacity>

          <View style={styles.monthTitleWrap}>
            <Text style={styles.monthTitle}>
              {MONTHS[month.month - 1].charAt(0).toUpperCase() + MONTHS[month.month - 1].slice(1)} {month.year}
            </Text>
            {pending && <ActivityIndicator size="small" color={Colors.lblue} />}
          </View>

          <TouchableOpacity style={styles.navButton} onPress={() => changeMonth(1)} accessibilityLabel="Mois suivant">
            <Ionicons name="chevron-forward" size={20} color={Colors.lblueDark} />
          </TouchableOpacity>
        </View>

        {/* ---- Mode période ---- */}
        {rangeMode ? (
          <View style={styles.rangeBanner}>
            <Text style={styles.rangeText}>
              {rangeStart
                ? `Début : ${formatShortDate(rangeStart)}. Touchez le dernier jour.`
                : 'Touchez le premier jour de la période.'}
            </Text>
            <TouchableOpacity onPress={() => { setRangeMode(false); setRangeStart(null); }} hitSlop={8}>
              <Text style={styles.rangeCancel}>Annuler</Text>
            </TouchableOpacity>
          </View>
        ) : RANGE_ENABLED ? (
          <TouchableOpacity style={styles.rangeButton} onPress={() => setRangeMode(true)} activeOpacity={0.7}>
            <Ionicons name="airplane-outline" size={18} color={Colors.lblueDark} />
            <Text style={styles.rangeButtonText}>Fermer une période (congés, congrès…)</Text>
          </TouchableOpacity>
        ) : null}

        {/* ---- Grille ---- */}
        <View style={styles.weekHeader}>
          {WEEKDAYS_SHORT.slice(1).map((label, i) => (
            <Text key={i} style={styles.weekHeaderText}>{label}</Text>
          ))}
        </View>

        {monthMatrix(month.year, month.month).map((week, w) => (
          <View key={w} style={styles.week}>
            {week.map((date, d) => {
              if (!date) return <View key={d} style={styles.day} />;

              const past = date < today;
              const isToday = date === today;
              const selected = rangeStart === date;

              return (
                <TouchableOpacity
                  key={d}
                  style={[styles.day, selected && styles.daySelected]}
                  onPress={() => onDayPress(date)}
                  disabled={past || pending}
                  activeOpacity={0.6}
                  accessibilityLabel={formatLongDate(date)}
                >
                  <View style={[styles.dayNumberWrap, isToday && styles.dayToday]}>
                    <Text style={[styles.dayNumber, past && styles.dayPast, isToday && styles.dayNumberToday]}>
                      {Number(date.slice(8))}
                    </Text>
                  </View>
                  {!past && (
                    <View style={styles.dayBars}>
                      {PERIODS.map((period) => (
                        <View
                          key={period}
                          style={[styles.dayBar, { backgroundColor: STATE_COLORS[periodState(date, period)] }]}
                        />
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* ---- Légende ---- */}
        <View style={styles.legend}>
          {(['open', 'blocked', 'added'] as PeriodState[]).map((state) => (
            <View key={state} style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: STATE_COLORS[state] }]} />
              <Text style={styles.legendText}>
                {state === 'open' ? 'Semaine type' : state === 'blocked' ? 'Fermé' : 'Ouverture exceptionnelle'}
              </Text>
            </View>
          ))}
        </View>
        <Text style={styles.hint}>Barre de gauche : matin · barre de droite : après-midi.</Text>
      </View>

      {/* ---- Liste ---- */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Exceptions à venir</Text>

        {groups.length === 0 ? (
          <Text style={[styles.hint, styles.listEmpty]}>Aucune exception : la semaine type s'applique partout.</Text>
        ) : (
          groups.map((group) => {
            const dates =
              group.from === group.to
                ? formatLongDate(group.from, todayYear)
                : `Du ${formatShortDate(group.from)} au ${formatShortDate(group.to, true)}`;
            const period = group.period ? PERIOD_LABELS[group.period] : 'journée entière';

            return (
              <View key={`${group.from}-${group.period}-${group.type}`} style={styles.listRow}>
                <View style={styles.flex}>
                  <Text style={styles.listDate}>{dates.charAt(0).toUpperCase() + dates.slice(1)}</Text>
                  <Text style={styles.hint}>{period.charAt(0).toUpperCase() + period.slice(1)}</Text>
                </View>
                <View style={[styles.pill, group.type === 'block' ? styles.pillBlock : styles.pillAdd]}>
                  <Text style={[styles.pillText, { color: group.type === 'block' ? Colors.danger : Colors.success }]}>
                    {group.type === 'block' ? 'Fermé' : 'Ouvert'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => removeExceptions(group.ids)}
                  disabled={pending}
                  hitSlop={8}
                  accessibilityLabel="Supprimer l'exception"
                >
                  <Ionicons name="trash-outline" size={20} color={Colors.subtext} />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>

      <BookingActionSheet
        visible={!!sheet}
        title={sheet?.title ?? ''}
        subtitle={sheet?.subtitle}
        actions={sheet?.actions ?? []}
        onClose={() => {
          setSheet(null);
          // Période abandonnée : on repart du premier jour au prochain toucher.
          if (rangeMode && rangeStart) setRangeStart(null);
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  /* ---- Structure ---- */
  content: {
    padding: Spacings.md,
    gap: Spacings.md,
  },
  flex: {
    flex: 1,
  },
  card: {
    padding: Spacings.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  cardTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: Colors.text,
  },
  hint: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.subtext2,
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
    borderRadius: 12,
    backgroundColor: Colors.lblue3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: {
    backgroundColor: Colors.grayLight,
  },
  monthTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  monthTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: Colors.text,
  },

  /* ---- Mode période ---- */
  rangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.xs,
    height: 44,
    marginTop: Spacings.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.lblue2,
  },
  rangeButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: Colors.lblueDark,
  },
  rangeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    minHeight: 44,
    marginTop: Spacings.md,
    paddingHorizontal: Spacings.md,
    borderRadius: 12,
    backgroundColor: Colors.lblueDark,
  },
  rangeText: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: Colors.white,
  },
  rangeCancel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: Colors.white,
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
    color: Colors.subtext,
  },
  week: {
    flexDirection: 'row',
  },
  day: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.xxs,
    borderRadius: 10,
  },
  daySelected: {
    backgroundColor: Colors.lblue3,
  },
  dayNumberWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToday: {
    borderWidth: 1.5,
    borderColor: Colors.lblueDark,
  },
  dayNumber: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.text,
  },
  dayNumberToday: {
    color: Colors.lblueDark,
  },
  dayPast: {
    color: Colors.disabledBackground,
  },
  dayBars: {
    flexDirection: 'row',
    gap: 2,
  },
  dayBar: {
    width: 10,
    height: 4,
    borderRadius: 2,
  },

  /* ---- Légende ---- */
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.md,
    marginTop: Spacings.md,
    marginBottom: Spacings.xxs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xxs,
  },
  legendSwatch: {
    width: 14,
    height: 4,
    borderRadius: 2,
  },
  legendText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.subtext2,
  },

  /* ---- Liste ---- */
  listEmpty: {
    marginTop: Spacings.xs,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    paddingVertical: Spacings.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  listDate: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.text,
  },
  pill: {
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.xxxs,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillBlock: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerBackground,
  },
  pillAdd: {
    borderColor: Colors.success,
    backgroundColor: Colors.successBackground,
  },
  pillText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
  },
});