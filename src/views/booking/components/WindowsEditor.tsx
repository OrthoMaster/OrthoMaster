import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import { BookingPeriod, BookingWindowInput } from '../../../services/v2/BookingService';
import { MONTHS, WEEKDAYS_SHORT, addDays, formatLongDate, fromMinutes, monthMatrix, toMinutes } from '../bookingDates';
import { tint, withAlpha } from '../bookingPalette';
import {
  MAX_SPAN_DAYS,
  MAX_WINDOWS,
  STEP_MINUTES,
  consultationWindowError,
  themeHalfDaysTotal,
  themeWindowError,
  windowLabel,
  windowsOverlap,
} from '../bookingWindows';

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const PERIODS: BookingPeriod[] = ['morning', 'afternoon'];
const PERIOD_LABELS: Record<BookingPeriod, string> = { morning: 'Matin', afternoon: 'Après-midi' };

interface WindowsEditorProps {
  kind: 'consultation' | 'theme';
  windows: BookingWindowInput[];
  onChange: (next: BookingWindowInput[]) => void;
  /** Consultation : durée estimée (minutes). Thème : nombre de demi-journées. */
  minutes?: number;
  blocksCount?: number;
  /** Bornes réservables (jours, heure de l'expert). */
  firstDate: string;
  lastDate: string;
  color: string;
  /** Contour rouge : envoi tenté sans créneau. */
  error?: boolean;
  /** Ouverture / fermeture de l'éditeur (le parent peut retenir l'envoi tant qu'il est ouvert). */
  onEditingChange?: (editing: boolean) => void;
}

/**
 * Créneaux proposés hors calendrier (mobile et web), jusqu'à 3. Chaque créneau se compose
 * d'un jour de début et d'un jour de fin (choisis sur le calendrier, plusieurs jours possibles),
 * avec une heure (consultation, par 30 min, sur 24 h) ou une demi-journée (thème) à chaque bout.
 */
export const WindowsEditor: React.FC<WindowsEditorProps> = ({
  kind,
  windows,
  onChange,
  minutes = 30,
  blocksCount = 1,
  firstDate,
  lastDate,
  color,
  error,
  onEditingChange,
}) => {
  const consultation = kind === 'consultation';
  const [draft, setDraft] = useState<BookingWindowInput | null>(null);
  const [picking, setPicking] = useState<'start' | 'end'>('start');
  const [month, setMonth] = useState<{ year: number; month: number }>(() => {
    const [y, m] = firstDate.split('-').map(Number);
    return { year: y, month: m };
  });
  const soft = tint(color, 0.12);

  const openEditor = () => {
    const start = firstDate;
    const next: BookingWindowInput = consultation
      ? {
          start_date: start,
          end_date: start,
          start_time: '09:00',
          end_time: fromMinutes(Math.min(toMinutes('09:00') + Math.max(minutes, 180), 23 * 60 + 30)),
        }
      : { start_date: start, end_date: start, start_period: 'morning', end_period: 'afternoon' };
    if (!consultation && blocksCount > 2) next.end_date = addDays(start, Math.ceil(blocksCount / 2) - 1);
    setDraft(next);
    setPicking('start');
    onEditingChange?.(true);
  };

  const closeEditor = () => {
    setDraft(null);
    onEditingChange?.(false);
  };

  const draftError = draft
    ? (consultation ? consultationWindowError(draft, minutes) : themeWindowError(draft)) ??
      (windows.some((w) => windowsOverlap(w, draft)) ? 'Ce créneau chevauche un créneau déjà proposé.' : null)
    : null;

  const save = () => {
    if (!draft || draftError) return;
    onChange([...windows, draft].sort((a, b) => (a.start_date + (a.start_time ?? a.start_period)).localeCompare(b.start_date + (b.start_time ?? b.start_period))));
    closeEditor();
  };

  /* ---- Calendrier : jour de début puis jour de fin ---- */
  const canMonth = (delta: number) => {
    const index = month.year * 12 + month.month + delta;
    const [fy, fm] = firstDate.split('-').map(Number);
    const [ly, lm] = lastDate.split('-').map(Number);
    return index >= fy * 12 + fm && index <= ly * 12 + lm;
  };
  const changeMonth = (delta: number) => {
    if (!canMonth(delta)) return;
    const index = month.year * 12 + (month.month - 1) + delta;
    setMonth({ year: Math.floor(index / 12), month: (index % 12) + 1 });
  };
  const pickDay = (date: string) => {
    if (!draft) return;
    if (picking === 'start' || date < draft.start_date) {
      // Nouveau début : la fin suit (même jour au moins), dans la limite de durée.
      const end = draft.end_date < date ? date : draft.end_date;
      setDraft({ ...draft, start_date: date, end_date: end > addDays(date, MAX_SPAN_DAYS) ? date : end });
      setPicking('end');
    } else {
      setDraft({ ...draft, end_date: date > addDays(draft.start_date, MAX_SPAN_DAYS) ? addDays(draft.start_date, MAX_SPAN_DAYS) : date });
      setPicking('start');
    }
  };

  /* ---- Heures (consultation) ---- */
  const stepTime = (key: 'start_time' | 'end_time', dir: 1 | -1) => {
    if (!draft) return;
    const current = toMinutes(draft[key] ?? '09:00');
    const next = (current + dir * STEP_MINUTES + 1440) % 1440;
    setDraft({ ...draft, [key]: fromMinutes(next) });
  };

  const year = new Date().getFullYear();

  const timeStepper = (key: 'start_time' | 'end_time') => (
    <View style={[styles.stepper, { backgroundColor: soft }]}>
      <TouchableOpacity style={styles.stepButton} onPress={() => stepTime(key, -1)} accessibilityLabel="Plus tôt" hitSlop={6}>
        <Ionicons name="remove" size={18} color={color} />
      </TouchableOpacity>
      <Text style={styles.stepValue}>{draft?.[key]}</Text>
      <TouchableOpacity style={styles.stepButton} onPress={() => stepTime(key, 1)} accessibilityLabel="Plus tard" hitSlop={6}>
        <Ionicons name="add" size={18} color={color} />
      </TouchableOpacity>
    </View>
  );

  const periodPicker = (key: 'start_period' | 'end_period') => (
    <View style={[styles.periods, { backgroundColor: soft }]}>
      {PERIODS.map((p) => {
        const on = draft?.[key] === p;
        return (
          <TouchableOpacity
            key={p}
            style={[styles.period, on && { backgroundColor: color }]}
            onPress={() => draft && setDraft({ ...draft, [key]: p })}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
          >
            <Text style={[styles.periodText, { color: on ? Colors.white : color }]}>{PERIOD_LABELS[p]}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const endLine = (side: 'start' | 'end') => {
    const date = side === 'start' ? draft!.start_date : draft!.end_date;
    const active = picking === side;
    return (
      <View style={styles.endRow}>
        <TouchableOpacity
          style={[styles.endDate, active && { borderColor: color, backgroundColor: soft }]}
          onPress={() => setPicking(side)}
          accessibilityRole="button"
          accessibilityLabel={side === 'start' ? 'Jour de début' : 'Jour de fin'}
        >
          <Text style={styles.endLabel}>{side === 'start' ? 'Début' : 'Fin'}</Text>
          <Text style={styles.endValue} numberOfLines={1}>
            {capitalize(formatLongDate(date, year))}
          </Text>
        </TouchableOpacity>
        {consultation
          ? timeStepper(side === 'start' ? 'start_time' : 'end_time')
          : periodPicker(side === 'start' ? 'start_period' : 'end_period')}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Thème : le total compte, pas chaque créneau ; l'expert y choisit ses demi-journées. */}
      {!consultation && blocksCount > 1 ? (
        <Text style={styles.hint}>
          Au total, au moins {blocksCount} demi-journées ({themeHalfDaysTotal(windows)} couverte
          {themeHalfDaysTotal(windows) > 1 ? 's' : ''}) : l'expert y choisit les siennes, consécutives ou non.
        </Text>
      ) : null}
      {/* ---- Créneaux proposés ---- */}
      {windows.map((w, i) => (
        <View key={i} style={[styles.item, { borderColor: withAlpha(color, 0.35), backgroundColor: soft }]}>
          <View style={[styles.itemIndex, { backgroundColor: color }]}>
            <Text style={styles.itemIndexText}>{i + 1}</Text>
          </View>
          <Text style={styles.itemText}>{windowLabel(w, year)}</Text>
          <TouchableOpacity
            onPress={() => onChange(windows.filter((_, j) => j !== i))}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Retirer le créneau ${i + 1}`}
          >
            <Ionicons name="close-circle" size={22} color={Colors.subtext} />
          </TouchableOpacity>
        </View>
      ))}

      {/* ---- Éditeur d'un créneau ---- */}
      {draft ? (
        <View style={[styles.editor, { borderColor: withAlpha(color, 0.45) }]}>
          <Text style={styles.editorTitle}>Créneau {windows.length + 1}</Text>
          {endLine('start')}
          {endLine('end')}
          <Text style={styles.hint}>
            {picking === 'start' ? 'Touchez le jour de début.' : 'Touchez le jour de fin (le même jour ou plus tard).'}
          </Text>

          <View style={styles.monthNav}>
            <TouchableOpacity onPress={() => changeMonth(-1)} disabled={!canMonth(-1)} hitSlop={8} accessibilityLabel="Mois précédent">
              <Ionicons name="chevron-back" size={20} color={canMonth(-1) ? color : Colors.border} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {capitalize(MONTHS[month.month - 1])} {month.year}
            </Text>
            <TouchableOpacity onPress={() => changeMonth(1)} disabled={!canMonth(1)} hitSlop={8} accessibilityLabel="Mois suivant">
              <Ionicons name="chevron-forward" size={20} color={canMonth(1) ? color : Colors.border} />
            </TouchableOpacity>
          </View>
          <View style={styles.week}>
            {WEEKDAYS_SHORT.slice(1).map((label, i) => (
              <Text key={i} style={styles.weekLabel}>
                {label}
              </Text>
            ))}
          </View>
          {monthMatrix(month.year, month.month).map((week, w) => (
            <View key={w} style={styles.week}>
              {week.map((date, d) => {
                if (!date) return <View key={d} style={styles.day} />;
                const enabled = date >= firstDate && date <= lastDate;
                const edge = date === draft.start_date || date === draft.end_date;
                const inside = date > draft.start_date && date < draft.end_date;
                return (
                  <TouchableOpacity
                    key={d}
                    style={[styles.day, inside && { backgroundColor: soft }]}
                    disabled={!enabled}
                    onPress={() => pickDay(date)}
                    accessibilityLabel={formatLongDate(date)}
                  >
                    <View style={[styles.dayCircle, edge && { backgroundColor: color }]}>
                      <Text style={[styles.dayText, { color: edge ? Colors.white : enabled ? Colors.text : Colors.border }]}>
                        {Number(date.slice(8))}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          {draftError ? <Text style={styles.error}>{draftError}</Text> : null}
          <View style={styles.editorActions}>
            <TouchableOpacity style={styles.cancel} onPress={closeEditor} accessibilityRole="button">
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.add, { backgroundColor: color }, !!draftError && styles.addOff]}
              onPress={save}
              disabled={!!draftError}
              accessibilityRole="button"
            >
              <Text style={styles.addText}>Ajouter ce créneau</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : windows.length < MAX_WINDOWS ? (
        <TouchableOpacity
          style={[styles.newButton, { borderColor: error ? Colors.danger : withAlpha(color, 0.5) }]}
          onPress={openEditor}
          accessibilityRole="button"
        >
          <Ionicons name="add-circle-outline" size={20} color={color} />
          <Text style={[styles.newText, { color }]}>
            {windows.length === 0 ? 'Proposer un créneau' : 'Ajouter un autre créneau'}
          </Text>
          <Text style={styles.newCount}>
            {windows.length}/{MAX_WINDOWS}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacings.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    paddingVertical: Spacings.sm,
    paddingHorizontal: Spacings.sm,
    borderRadius: 14,
    borderWidth: 1,
  },
  itemIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIndexText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: Colors.white,
  },
  itemText: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.text,
  },
  editor: {
    padding: Spacings.md,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: Colors.white,
    gap: Spacings.xs,
  },
  editorTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: Colors.text,
  },
  endRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacings.xs,
  },
  endDate: {
    flex: 1,
    minWidth: 170,
    paddingVertical: 6,
    paddingHorizontal: Spacings.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  endLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: Colors.subtext2,
  },
  endValue: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.text,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
    borderRadius: 12,
  },
  stepButton: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  stepValue: {
    minWidth: 58,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
    fontSize: 17,
    color: Colors.text,
  },
  periods: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
    borderRadius: 12,
  },
  period: {
    paddingHorizontal: Spacings.sm,
    paddingVertical: 8,
    borderRadius: 9,
  },
  periodText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
  },
  hint: {
    fontFamily: 'Roboto',
    fontSize: 12,
    color: Colors.subtext,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacings.xs,
  },
  monthTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: Colors.text,
  },
  week: {
    flexDirection: 'row',
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    color: Colors.subtext,
  },
  day: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
  },
  error: {
    fontFamily: 'Roboto',
    fontSize: 13,
    color: Colors.danger,
  },
  editorActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacings.xs,
    marginTop: Spacings.xs,
  },
  cancel: {
    paddingHorizontal: Spacings.md,
    paddingVertical: 10,
    borderRadius: 12,
  },
  cancelText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.subtext2,
  },
  add: {
    paddingHorizontal: Spacings.md,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addOff: {
    opacity: 0.45,
  },
  addText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.white,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    paddingVertical: Spacings.sm,
    paddingHorizontal: Spacings.md,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    backgroundColor: Colors.white,
  },
  newText: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  newCount: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.subtext,
  },
});
