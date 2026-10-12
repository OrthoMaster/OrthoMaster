import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import Colors from '../../../../../constants/Colors';
import Spacings from '../../../../../constants/Spacings';

import {
  BookingPeriod,
  BookingWeekday,
  ExpertAvailabilityRule,
  ExpertBookingSetup,
  addMyAvailabilityRules,
  deleteMyAvailabilityRule,
  fieldError,
  updateMyBookingSettings,
} from '../../../../services/v2/BookingService';
import { BookingActionSheet, BookingSheetAction } from '../../components/BookingActionSheet';
import { WEEKDAYS, formatDuration, formatShortDate, fromMinutes, toMinutes } from '../../bookingDates';
import { notify } from '../../bookingActions';

const TIME_STEP = 15;
const NOTICE_STEP = 12;

const PERIODS: { key: BookingPeriod; label: string }[] = [
  { key: 'morning', label: 'Matin' },
  { key: 'afternoon', label: 'Après-midi' },
];

type TimeKey = 'morning_start' | 'morning_end' | 'afternoon_start' | 'afternoon_end';

interface SettingsForm {
  morning_start: string;
  morning_end: string;
  afternoon_start: string;
  afternoon_end: string;
  min_notice_hours: number;
  max_advance_months: number;
}

const formFromSetup = (setup: ExpertBookingSetup): SettingsForm => {
  const r = setup.settings.resolved;
  return {
    morning_start: r.morning_start,
    morning_end: r.morning_end,
    afternoon_start: r.afternoon_start,
    afternoon_end: r.afternoon_end,
    min_notice_hours: r.min_notice_hours,
    max_advance_months: r.max_advance_months,
  };
};

const validityLabel = (rule: ExpertAvailabilityRule) => {
  if (rule.valid_from && rule.valid_until) {
    return `Du ${formatShortDate(rule.valid_from)} au ${formatShortDate(rule.valid_until, true)}`;
  }
  if (rule.valid_from) return `Dès le ${formatShortDate(rule.valid_from, true)}`;
  if (rule.valid_until) return `Jusqu'au ${formatShortDate(rule.valid_until, true)}`;
  return 'Toutes les semaines';
};

const noticeLabel = (hours: number) =>
  hours % 24 === 0 ? `${hours} h (${hours / 24} ${hours / 24 > 1 ? 'jours' : 'jour'})` : `${hours} h`;

/* ---- Sélecteurs ---- */

interface StepperProps {
  value: string;
  onMinus: () => void;
  onPlus: () => void;
  minusDisabled?: boolean;
  plusDisabled?: boolean;
  accessibilityLabel: string;
}

const Stepper: React.FC<StepperProps> = ({ value, onMinus, onPlus, minusDisabled, plusDisabled, accessibilityLabel }) => (
  <View style={styles.stepper}>
    <TouchableOpacity
      style={[styles.stepperButton, minusDisabled && styles.stepperButtonDisabled]}
      onPress={onMinus}
      disabled={minusDisabled}
      hitSlop={6}
      accessibilityLabel={`${accessibilityLabel} : moins`}
    >
      <Ionicons name="remove" size={18} color={Colors.white} />
    </TouchableOpacity>
    <Text style={styles.stepperValue}>{value}</Text>
    <TouchableOpacity
      style={[styles.stepperButton, plusDisabled && styles.stepperButtonDisabled]}
      onPress={onPlus}
      disabled={plusDisabled}
      hitSlop={6}
      accessibilityLabel={`${accessibilityLabel} : plus`}
    >
      <Ionicons name="add" size={18} color={Colors.white} />
    </TouchableOpacity>
  </View>
);

/* ---- Onglet ---- */

interface WeekTabProps {
  setup: ExpertBookingSetup;
  apply: (next: ExpertBookingSetup) => void;
  onDirtyChange: (dirty: boolean) => void;
  bottomInset: number;
}

export const WeekTab: React.FC<WeekTabProps> = ({ setup, apply, onDirtyChange, bottomInset }) => {
  const { defaults } = setup.settings;
  const { limits } = setup;

  const baseline = useMemo(() => formFromSetup(setup), [JSON.stringify(setup.settings.resolved)]);
  const [form, setForm] = useState<SettingsForm>(baseline);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [pendingCell, setPendingCell] = useState<string | null>(null);
  const [sheet, setSheet] = useState<{ title: string; subtitle?: string; actions: BookingSheetAction[] } | null>(null);

  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);

  // Réglages rechargés (tirer pour rafraîchir) : on suit le serveur tant que rien n'est en cours.
  useEffect(() => {
    if (!dirty) setForm(baseline);
  }, [baseline]);

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty]);

  /* ---- Horaires : validation en direct, mêmes règles que le serveur ---- */

  const blockLength = (period: BookingPeriod) =>
    toMinutes(form[`${period}_end` as TimeKey]) - toMinutes(form[`${period}_start` as TimeKey]);

  const periodError = (period: BookingPeriod) => {
    const length = blockLength(period);
    if (length < limits.block_min_minutes || length > limits.block_max_minutes) {
      return `Entre ${limits.block_min_minutes / 60} et ${limits.block_max_minutes / 60} heures.`;
    }
    return fieldError(errors, `${period}_end`) ?? fieldError(errors, `${period}_start`);
  };

  const overlapError =
    toMinutes(form.morning_end) > toMinutes(form.afternoon_start)
      ? "L'après-midi doit commencer après la fin du matin."
      : null;

  const invalid = PERIODS.some((p) => {
    const length = blockLength(p.key);
    return length < limits.block_min_minutes || length > limits.block_max_minutes;
  }) || !!overlapError;

  const shiftTime = (key: TimeKey, delta: number) => {
    const next = Math.min(24 * 60 - TIME_STEP, Math.max(0, toMinutes(form[key]) + delta));
    setForm((current) => ({ ...current, [key]: fromMinutes(next) }));
  };

  const usesDefaults =
    form.morning_start === defaults.morning_start &&
    form.morning_end === defaults.morning_end &&
    form.afternoon_start === defaults.afternoon_start &&
    form.afternoon_end === defaults.afternoon_end &&
    form.min_notice_hours === defaults.min_notice_hours &&
    form.max_advance_months === defaults.max_advance_months;

  const saveSettings = async () => {
    // Une valeur égale au défaut est envoyée à null : l'expert suivra les futurs changements du système.
    const own = <K extends keyof SettingsForm>(key: K) => (form[key] === defaults[key] ? null : form[key]);

    setSaving(true);
    const result = await updateMyBookingSettings({
      morning_start: own('morning_start'),
      morning_end: own('morning_end'),
      afternoon_start: own('afternoon_start'),
      afternoon_end: own('afternoon_end'),
      min_notice_hours: own('min_notice_hours'),
      max_advance_months: own('max_advance_months'),
    });
    setSaving(false);

    if (result.ok) {
      setErrors({});
      apply(result.data);
      setForm(formFromSetup(result.data));
    } else {
      setErrors(result.errors);
      if (Object.keys(result.errors).length === 0) {
        notify('Enregistrement impossible', result.message ?? 'Réessayez dans un instant.');
      }
    }
  };

  /* ---- Semaine type ---- */

  const cellRules = (weekday: number, period: BookingPeriod) =>
    setup.rules.filter((r) => r.weekday === weekday && r.period === period && !r.expired);

  const removeRules = async (rules: ExpertAvailabilityRule[], cellKey: string) => {
    setPendingCell(cellKey);
    let last: ExpertBookingSetup | null = null;
    for (const rule of rules) {
      const result = await deleteMyAvailabilityRule(rule.id);
      if (!result.ok) {
        notify('Suppression impossible', result.message ?? 'Réessayez dans un instant.');
        break;
      }
      last = result.data;
    }
    if (last) apply(last);
    setPendingCell(null);
  };

  const toggleCell = async (weekday: number, period: BookingPeriod) => {
    if (pendingCell) return;

    const key = `${weekday}-${period}`;
    const rules = cellRules(weekday, period);
    const periodLabel = PERIODS.find((p) => p.key === period)?.label.toLowerCase();

    if (rules.length === 0) {
      setPendingCell(key);
      const result = await addMyAvailabilityRules({ weekdays: [weekday as BookingWeekday], periods: [period] });
      setPendingCell(null);
      if (result.ok) apply(result.data);
      else notify('Ajout impossible', result.message ?? 'Réessayez dans un instant.');
      return;
    }

    // Créneau permanent : bascule directe. Créneau daté (créé au CMS) : on montre ses dates avant de supprimer.
    if (rules.every((r) => !r.valid_from && !r.valid_until)) {
      removeRules(rules, key);
      return;
    }

    setSheet({
      title: `${WEEKDAYS[weekday]} ${periodLabel}`,
      subtitle: 'Ce créneau a des dates de validité.',
      actions: [
        ...rules.map((rule) => ({
          key: `rule-${rule.id}`,
          label: `Supprimer : ${validityLabel(rule).toLowerCase()}`,
          icon: 'calendar-remove-outline' as const,
          tone: 'danger' as const,
          onPress: () => removeRules([rule], key),
        })),
        ...(rules.length > 1
          ? [{
            key: 'all',
            label: 'Tout supprimer',
            icon: 'delete-outline' as const,
            tone: 'danger' as const,
            onPress: () => removeRules(rules, key),
          }]
          : []),
      ],
    });
  };

  const openCount = setup.rules.filter((r) => !r.expired).length;

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: bottomInset + Spacings.md }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ---- Horaires ---- */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Horaires des demi-journées</Text>
          {!usesDefaults && (
            <TouchableOpacity onPress={() => setForm({ ...defaults })} hitSlop={8}>
              <Text style={styles.link}>Par défaut</Text>
            </TouchableOpacity>
          )}
        </View>

        {PERIODS.map((period) => {
          const error = periodError(period.key);
          const startKey = `${period.key}_start` as TimeKey;
          const endKey = `${period.key}_end` as TimeKey;

          return (
            <View key={period.key} style={styles.periodRow}>
              <View style={styles.periodHead}>
                <Text style={styles.periodLabel}>{period.label}</Text>
                <Text style={[styles.periodDuration, error && styles.textError]}>
                  {error ?? formatDuration(blockLength(period.key))}
                </Text>
              </View>
              <View style={styles.periodTimes}>
                <Stepper
                  value={form[startKey]}
                  onMinus={() => shiftTime(startKey, -TIME_STEP)}
                  onPlus={() => shiftTime(startKey, TIME_STEP)}
                  accessibilityLabel={`Début ${period.label}`}
                />
                <Text style={styles.timeSeparator}>à</Text>
                <Stepper
                  value={form[endKey]}
                  onMinus={() => shiftTime(endKey, -TIME_STEP)}
                  onPlus={() => shiftTime(endKey, TIME_STEP)}
                  accessibilityLabel={`Fin ${period.label}`}
                />
              </View>
            </View>
          );
        })}

        {overlapError && <Text style={[styles.hint, styles.textError]}>{overlapError}</Text>}

        {/* ---- Délais ---- */}
        <View style={styles.divider} />
        <Text style={styles.cardTitle}>Délais de réservation</Text>

        <View style={styles.delayRow}>
          <View style={styles.flex}>
            <Text style={styles.delayLabel}>Au plus tôt</Text>
            <Text style={styles.hint}>avant la demi-journée</Text>
          </View>
          <Stepper
            value={noticeLabel(form.min_notice_hours)}
            onMinus={() => setForm((f) => ({ ...f, min_notice_hours: f.min_notice_hours - NOTICE_STEP }))}
            onPlus={() => setForm((f) => ({ ...f, min_notice_hours: f.min_notice_hours + NOTICE_STEP }))}
            minusDisabled={form.min_notice_hours - NOTICE_STEP < NOTICE_STEP}
            plusDisabled={form.min_notice_hours + NOTICE_STEP > limits.max_notice_hours}
            accessibilityLabel="Délai minimum"
          />
        </View>

        <View style={styles.delayRow}>
          <View style={styles.flex}>
            <Text style={styles.delayLabel}>Au plus tard</Text>
            <Text style={styles.hint}>à partir d'aujourd'hui</Text>
          </View>
          <Stepper
            value={`${form.max_advance_months} mois`}
            onMinus={() => setForm((f) => ({ ...f, max_advance_months: f.max_advance_months - 1 }))}
            onPlus={() => setForm((f) => ({ ...f, max_advance_months: f.max_advance_months + 1 }))}
            minusDisabled={form.max_advance_months <= 1}
            plusDisabled={form.max_advance_months >= limits.max_advance_months}
            accessibilityLabel="Réservation au plus tard"
          />
        </View>

        {/* Le bouton n'apparaît qu'en cas de changement : l'état enregistré reste lisible d'un coup d'œil. */}
        {dirty && (
          <View style={styles.saveRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setForm(baseline)} disabled={saving}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, (invalid || saving) && styles.saveButtonDisabled]}
              onPress={saveSettings}
              disabled={invalid || saving}
            >
              {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveText}>Enregistrer</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ---- Semaine type ---- */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Semaine type</Text>
          <Text style={styles.counter}>{openCount} / 14</Text>
        </View>
        <Text style={[styles.hint, styles.gridHint]}>
          Touchez une demi-journée pour l'ouvrir ou la fermer chaque semaine.
        </Text>

        <View style={styles.gridHeader}>
          <View style={styles.dayColumn} />
          {PERIODS.map((period) => (
            <View key={period.key} style={styles.gridColumnHead}>
              <Text style={styles.gridColumnLabel}>{period.label}</Text>
              <Text style={styles.gridColumnHours}>
                {setup.settings.resolved[`${period.key}_start` as TimeKey]}–{setup.settings.resolved[`${period.key}_end` as TimeKey]}
              </Text>
            </View>
          ))}
        </View>

        {[1, 2, 3, 4, 5, 6, 7].map((weekday) => (
          <View key={weekday} style={styles.gridRow}>
            <Text style={styles.dayColumn}>{WEEKDAYS[weekday]}</Text>

            {PERIODS.map((period) => {
              const key = `${weekday}-${period.key}`;
              const rules = cellRules(weekday, period.key);
              const open = rules.length > 0;
              const dated = rules.find((r) => r.valid_from || r.valid_until);
              const pending = pendingCell === key;

              return (
                <TouchableOpacity
                  key={period.key}
                  style={[styles.cell, open ? styles.cellOpen : styles.cellClosed]}
                  onPress={() => toggleCell(weekday, period.key)}
                  disabled={!!pendingCell}
                  activeOpacity={0.7}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: open }}
                  accessibilityLabel={`${WEEKDAYS[weekday]} ${period.label}`}
                >
                  {pending ? (
                    <ActivityIndicator size="small" color={open ? Colors.white : Colors.lblueDark} />
                  ) : open ? (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                      {dated && (
                        <Text style={styles.cellDated} numberOfLines={1}>
                          {validityLabel(dated)}
                        </Text>
                      )}
                    </>
                  ) : (
                    <Ionicons name="add" size={20} color={Colors.subtext} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        <View style={styles.legend}>
          <MaterialCommunityIcons name="information-outline" size={16} color={Colors.subtext} />
          <Text style={styles.legendText}>
            Pour fermer une date précise (congés, congrès), utilisez l'onglet Exceptions.
          </Text>
        </View>
      </View>

      <BookingActionSheet
        visible={!!sheet}
        title={sheet?.title ?? ''}
        subtitle={sheet?.subtitle}
        actions={sheet?.actions ?? []}
        onClose={() => setSheet(null)}
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.line,
    marginVertical: Spacings.md,
  },
  link: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: Colors.lblueDark,
  },
  hint: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.subtext2,
  },
  textError: {
    color: Colors.danger,
  },

  /* ---- Horaires ---- */
  periodRow: {
    marginTop: Spacings.md,
  },
  periodHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: Spacings.xs,
  },
  periodLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.text,
  },
  periodDuration: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: Colors.success,
  },
  periodTimes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  timeSeparator: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.subtext2,
  },

  /* ---- Sélecteur ---- */
  stepper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacings.xxs,
    borderRadius: 10,
    backgroundColor: Colors.grayLight,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.lblueDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonDisabled: {
    backgroundColor: Colors.disabledBackground,
  },
  stepperValue: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.text,
  },

  /* ---- Délais ---- */
  delayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.md,
    marginTop: Spacings.sm,
  },
  delayLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.text,
  },

  /* ---- Enregistrement ---- */
  saveRow: {
    flexDirection: 'row',
    gap: Spacings.sm,
    marginTop: Spacings.lg,
  },
  cancelButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: Colors.subtext2,
  },
  saveButton: {
    flex: 2,
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.lblueDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: Colors.white,
  },

  /* ---- Semaine type ---- */
  counter: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: Colors.subtext,
  },
  gridHint: {
    marginTop: Spacings.xxs,
    marginBottom: Spacings.md,
  },
  gridHeader: {
    flexDirection: 'row',
    gap: Spacings.xs,
    marginBottom: Spacings.xs,
  },
  gridColumnHead: {
    flex: 1,
    alignItems: 'center',
  },
  gridColumnLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: Colors.text,
  },
  gridColumnHours: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: Colors.subtext,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    marginBottom: Spacings.xs,
  },
  dayColumn: {
    width: 76,
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: Colors.text,
  },
  cell: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacings.xxs,
  },
  cellOpen: {
    backgroundColor: Colors.lblue,
  },
  cellClosed: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.disabledBackground,
    backgroundColor: Colors.grayLight,
  },
  cellDated: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10,
    color: Colors.white,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.xs,
    marginTop: Spacings.sm,
  },
  legendText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.subtext2,
  },
});