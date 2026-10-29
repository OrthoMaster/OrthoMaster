import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Switch, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import Colors from '../../../../../constants/Colors';
import Spacings from '../../../../../constants/Spacings';

import {
  BookingMode,
  BookingPeriod,
  BookingScheduleType,
  ExpertBookingSetup,
  ExpertGridDate,
  fieldError,
} from '../../../../services/v2/BookingService';
import { SegmentedTabs } from '../../components/SegmentedTabs';
import { WEEKDAYS, WEEKDAYS_SHORT, weekdayIso } from '../../bookingDates';
import { LocationPickerSheet } from './LocationPickerSheet';
import { MODE_META as SHARED_MODE_META } from '../../components/ModePill';
import { OfferDatesPicker } from './OfferDatesPicker';

/** Saisie d'un mode dans le formulaire d'offre. */
export interface ModeForm {
  enabled: boolean;
  /** Texte saisi (virgule acceptée) ; converti à l'envoi. */
  price: string;
  schedule: BookingScheduleType;
  /** Dates précises : fermeture N jours avant. */
  ahead: number;
  /** « jour|période ». */
  slots: string[];
  /** « Y-m-d|période ». */
  dates: string[];
  /** Présentiel : lieu choisi pour une demi-journée de la grille encore sans lieu. */
  locations: Record<string, number>;
}

/** Mêmes icônes que le choix des demi-journées côté confrère (SlotPicker). */
const PERIODS: { key: BookingPeriod; label: string; short: string; icon: 'weather-sunset-up' | 'weather-sunny' }[] = [
  { key: 'morning', label: 'matin', short: 'Matin', icon: 'weather-sunset-up' },
  { key: 'afternoon', label: 'après-midi', short: 'Après-midi', icon: 'weather-sunny' },
];

/** Couleur forte, fond doux et filet de chaque mode : bleu en visio, violet en présentiel (définition commune). */
const MODE_META: Record<BookingMode, (typeof SHARED_MODE_META)[BookingMode] & { title: string }> = {
  online: { ...SHARED_MODE_META.online, title: SHARED_MODE_META.online.label },
  onsite: { ...SHARED_MODE_META.onsite, title: SHARED_MODE_META.onsite.label },
};

const SCHEDULE_HINTS: Record<BookingScheduleType, string> = {
  weekly_all: 'Toutes les demi-journées ouvertes de votre semaine type.',
  weekly_selected: 'Seulement les demi-journées cochées, chaque semaine.',
  dates: 'Seulement les dates choisies dans le calendrier.',
};

const slotLabel = (key: string) => {
  const [weekday, period] = key.split('|');
  return `${WEEKDAYS[Number(weekday)]} ${PERIODS.find((p) => p.key === period)?.label ?? period}`;
};

const sortKeys = (keys: string[]) =>
  [...keys].sort((a, b) => {
    const [wa, pa] = a.split('|');
    const [wb, pb] = b.split('|');
    return Number(wa) - Number(wb) || (pa === pb ? 0 : pa === 'morning' ? -1 : 1);
  });

/**
 * Demi-journées de la semaine type qu'un mode utilise, d'après son calendrier :
 * toutes, celles cochées, ou celles des dates choisies.
 */
export const usedSlotKeys = (form: ModeForm, gridKeys: string[]): string[] => {
  if (form.schedule === 'weekly_all') return sortKeys(gridKeys);
  if (form.schedule === 'weekly_selected') return sortKeys(form.slots);
  return sortKeys([...new Set(form.dates.map((key) => {
    const [date, period] = key.split('|');
    return `${weekdayIso(date)}|${period}`;
  }))]);
};

interface OfferModeCardProps {
  mode: BookingMode;
  value: ModeForm;
  onChange: (next: ModeForm) => void;
  setup: ExpertBookingSetup;
  /** Demi-journées proposables pour « Dates précises » (chargées à la demande). */
  gridDates: ExpertGridDate[] | null;
  gridDatesLoading: boolean;
  errors: Record<string, string[]>;
  today: string;
  /** Lieu créé depuis la carte : état complet à écrire dans le cache. */
  onSetupChange: (next: ExpertBookingSetup) => void;
}

/**
 * Carte d'un mode (en ligne / en présentiel) : interrupteur, prix TTC, calendrier,
 * et pour le présentiel les adresses des demi-journées utilisées. Une demi-journée
 * déjà rattachée à un lieu le garde ; une demi-journée sans lieu en reçoit un ici,
 * fixé dans la semaine type à l'enregistrement et repris par les offres suivantes.
 */
export const OfferModeCard: React.FC<OfferModeCardProps> = ({
  mode,
  value,
  onChange,
  setup,
  gridDates,
  gridDatesLoading,
  errors,
  today,
  onSetupChange,
}) => {
  const meta = MODE_META[mode];
  const limits = setup.limits;
  const [pickerKey, setPickerKey] = useState<string | null>(null);

  const set = <K extends keyof ModeForm>(key: K, next: ModeForm[K]) => onChange({ ...value, [key]: next });

  // Toute la semaine type (le présentiel peut utiliser une demi-journée encore sans lieu).
  const gridLabels = useMemo(() => {
    const map: Record<string, string | null> = {};
    for (const slot of setup.grid.online) map[`${slot.weekday}|${slot.period}`] = slot.location_label;
    return map;
  }, [setup.grid]);
  const gridKeys = Object.keys(gridLabels);

  const locationsById = useMemo(
    () => Object.fromEntries(setup.locations.map((l) => [l.id, l])),
    [setup.locations]
  );

  const used = mode === 'onsite' ? usedSlotKeys(value, gridKeys) : [];
  const missing = used.filter((key) => !gridLabels[key] && !value.locations[key]);

  const err = (field: string) => fieldError(errors, `modes.${mode}.${field}`);

  const toggleSlot = (key: string) =>
    set('slots', value.slots.includes(key) ? value.slots.filter((k) => k !== key) : [...value.slots, key]);

  const assignedLabel = (date: string, period: BookingPeriod) => {
    const id = value.locations[`${weekdayIso(date)}|${period}`];
    return id ? locationsById[id]?.label ?? null : null;
  };

  return (
    <View style={[styles.card, value.enabled && { borderColor: meta.color }]}>
      {/* ---- En-tête ---- */}
      <View style={styles.head}>
        <View style={[styles.headIcon, { backgroundColor: meta.soft }]}>
          <MaterialCommunityIcons name={meta.icon} size={22} color={meta.color} />
        </View>
        <Text style={styles.headTitle}>{meta.title}</Text>
        <Switch
          value={value.enabled}
          onValueChange={(enabled) => set('enabled', enabled)}
          trackColor={{ false: Colors.disabledBackground, true: meta.color }}
          thumbColor={Colors.white}
          ios_backgroundColor={value.enabled ? meta.color : Colors.disabledBackground}
        />
      </View>

      {value.enabled && (
        <View style={styles.body}>
          {/* ---- Prix ---- */}
          <View style={styles.field}>
            <Text style={styles.label}>Prix</Text>
            <View style={[styles.priceRow, err('price') && styles.inputError]}>
              <TextInput
                style={styles.priceInput}
                value={value.price}
                onChangeText={(text) => set('price', text.replace(/[^0-9.,]/g, ''))}
                placeholder="0"
                placeholderTextColor={Colors.subtext}
                keyboardType="decimal-pad"
              />
              <Text style={styles.priceCurrency}>€</Text>
            </View>
            {err('price') && <Text style={styles.error}>{err('price')}</Text>}
          </View>

          {/* ---- Calendrier ---- */}
          <View style={styles.field}>
            <Text style={styles.label}>Demi-journées proposées</Text>
            <SegmentedTabs
              tabs={[
                { key: 'weekly_all', label: 'Toutes' },
                { key: 'weekly_selected', label: 'Certaines' },
                { key: 'dates', label: 'Dates' },
              ]}
              value={value.schedule}
              onChange={(schedule) => set('schedule', schedule)}
              color={meta.color}
            />
            <Text style={styles.hint}>{SCHEDULE_HINTS[value.schedule]}</Text>
            {err('schedule_type') && <Text style={styles.error}>{err('schedule_type')}</Text>}
          </View>

          {value.schedule === 'weekly_all' && gridKeys.length === 0 && (
            <Text style={styles.error}>Votre semaine type est vide : ouvrez des demi-journées dans Disponibilités.</Text>
          )}

          {/* Certaines : une colonne par jour, matin au-dessus de l'après-midi. */}
          {value.schedule === 'weekly_selected' && (
            <View style={styles.field}>
              <View style={styles.weekGrid}>
                {[1, 2, 3, 4, 5, 6, 7].map((weekday) => (
                  <View key={weekday} style={styles.weekColumn}>
                    <Text style={styles.weekDay}>{WEEKDAYS_SHORT[weekday]}</Text>
                    {PERIODS.map((period) => {
                      const key = `${weekday}|${period.key}`;
                      if (!(key in gridLabels)) {
                        return <View key={period.key} style={[styles.weekCell, styles.weekCellEmpty]} />;
                      }
                      const on = value.slots.includes(key);
                      return (
                        <TouchableOpacity
                          key={period.key}
                          style={[styles.weekCell, on ? { backgroundColor: meta.color } : { borderColor: meta.color }]}
                          onPress={() => toggleSlot(key)}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: on }}
                          accessibilityLabel={slotLabel(key)}
                        >
                          <MaterialCommunityIcons name={period.icon} size={20} color={on ? Colors.white : meta.color} />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
              <View style={styles.legend}>
                {PERIODS.map((period) => (
                  <View key={period.key} style={styles.legendItem}>
                    <MaterialCommunityIcons name={period.icon} size={16} color={meta.color} />
                    <Text style={styles.hint}>{period.short}</Text>
                  </View>
                ))}
              </View>
              {err('slots') && <Text style={styles.error}>{err('slots')}</Text>}
            </View>
          )}

          {/* Dates précises : calendrier, puis fermeture N jours avant. */}
          {value.schedule === 'dates' && (
            <View style={styles.field}>
              {gridDatesLoading || !gridDates ? (
                <ActivityIndicator color={meta.color} style={styles.loader} />
              ) : (
                <OfferDatesPicker
                  available={gridDates}
                  value={value.dates}
                  onChange={(dates) => set('dates', dates)}
                  today={today}
                  showLocation={mode === 'onsite'}
                  assignedLabel={assignedLabel}
                  color={meta.color}
                  soft={meta.soft}
                  line={meta.line}
                />
              )}
              {err('dates') && <Text style={styles.error}>{err('dates')}</Text>}

              <View style={styles.aheadRow}>
                <View style={styles.flex}>
                  <Text style={styles.label}>Fermer les réservations</Text>
                  <Text style={styles.hint}>jours avant chaque date</Text>
                </View>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={[styles.stepperButton, { backgroundColor: meta.color }, value.ahead <= (limits.book_ahead?.min ?? 1) && styles.stepperDisabled]}
                    onPress={() => set('ahead', value.ahead - 1)}
                    disabled={value.ahead <= (limits.book_ahead?.min ?? 1)}
                    accessibilityLabel="Moins de jours"
                  >
                    <Ionicons name="remove" size={18} color={Colors.white} />
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>
                    {value.ahead} j
                  </Text>
                  <TouchableOpacity
                    style={[styles.stepperButton, { backgroundColor: meta.color }, value.ahead >= (limits.book_ahead?.max ?? 90) && styles.stepperDisabled]}
                    onPress={() => set('ahead', value.ahead + 1)}
                    disabled={value.ahead >= (limits.book_ahead?.max ?? 90)}
                    accessibilityLabel="Plus de jours"
                  >
                    <Ionicons name="add" size={18} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              </View>
              {err('book_ahead_days') && <Text style={styles.error}>{err('book_ahead_days')}</Text>}
            </View>
          )}

          {/* ---- Présentiel : adresse de chaque demi-journée utilisée ---- */}
          {mode === 'onsite' && used.length > 0 && (
            <View style={styles.field}>
              <Text style={styles.label}>Adresses</Text>
              <Text style={styles.hint}>
                Une adresse choisie ici est fixée pour cette demi-journée de la semaine et reprise par vos autres offres.
              </Text>

              {used.map((key) => {
                const fixed = gridLabels[key];
                const assigned = value.locations[key] ? locationsById[value.locations[key]] : null;

                if (fixed) {
                  return (
                    <View key={key} style={styles.addressRow}>
                      <Text style={styles.addressSlot}>{slotLabel(key)}</Text>
                      <View style={styles.addressFixed}>
                        <Ionicons name="lock-closed" size={12} color={Colors.subtext} />
                        <Text style={styles.addressFixedText} numberOfLines={1}>{fixed}</Text>
                      </View>
                    </View>
                  );
                }

                return (
                  <TouchableOpacity key={key} style={styles.addressRow} onPress={() => setPickerKey(key)}>
                    <Text style={styles.addressSlot}>{slotLabel(key)}</Text>
                    <View style={[styles.addressPick, !assigned && styles.addressPickMissing]}>
                      <Text
                        style={[styles.addressPickText, !assigned && styles.addressPickTextMissing]}
                        numberOfLines={1}
                      >
                        {assigned ? assigned.label : 'Choisir une adresse'}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color={assigned ? meta.color : Colors.warning} />
                    </View>
                  </TouchableOpacity>
                );
              })}

              {missing.length > 0 && (
                <Text style={styles.warnText}>
                  {value.schedule === 'weekly_all'
                    ? 'Les demi-journées sans adresse ne seront pas proposées en présentiel.'
                    : 'Choisissez une adresse pour chaque demi-journée.'}
                </Text>
              )}
              {err('locations') && <Text style={styles.error}>{err('locations')}</Text>}
            </View>
          )}
        </View>
      )}

      <LocationPickerSheet
        visible={!!pickerKey}
        title={pickerKey ? slotLabel(pickerKey) : ''}
        subtitle="Adresse de cette demi-journée, chaque semaine."
        locations={setup.locations}
        selectedId={pickerKey ? value.locations[pickerKey] ?? null : null}
        placesEnabled={limits.places?.enabled ?? false}
        minInput={limits.places?.min_input ?? 3}
        labelMax={limits.location?.label_max ?? 60}
        accessMax={limits.location?.access_max ?? 1000}
        onSelect={(id) => {
          if (pickerKey && id) set('locations', { ...value.locations, [pickerKey]: id });
          setPickerKey(null);
        }}
        onCreated={(next, id) => {
          onSetupChange(next);
          if (pickerKey) set('locations', { ...value.locations, [pickerKey]: id });
          setPickerKey(null);
        }}
        onClose={() => setPickerKey(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  /* ---- Carte ---- */
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    padding: Spacings.md,
  },
  headIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headTitle: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: Colors.text,
  },
  body: {
    gap: Spacings.lg,
    paddingHorizontal: Spacings.md,
    paddingBottom: Spacings.md,
    paddingTop: Spacings.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
  flex: {
    flex: 1,
  },
  loader: {
    paddingVertical: Spacings.lg,
  },

  /* ---- Champs ---- */
  field: {
    gap: Spacings.xs,
  },
  label: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.text,
  },
  hint: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.subtext2,
  },
  error: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.danger,
  },
  warnText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.yellowDark,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: Spacings.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  priceInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: Colors.text,
  },
  priceCurrency: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: Colors.subtext2,
  },

  /* ---- Certaines demi-journées ---- */
  weekGrid: {
    flexDirection: 'row',
    gap: 4,
  },
  weekColumn: {
    flex: 1,
    gap: 4,
  },
  weekDay: {
    textAlign: 'center',
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    color: Colors.subtext,
  },
  weekCell: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekCellEmpty: {
    borderStyle: 'dashed',
    borderColor: Colors.border,
    backgroundColor: Colors.grayLight,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacings.lg,
    marginTop: Spacings.xxs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  /* ---- Fermeture avant la date ---- */
  aheadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.md,
    marginTop: Spacings.sm,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    padding: Spacings.xxs,
    borderRadius: 10,
    backgroundColor: Colors.grayLight,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperDisabled: {
    backgroundColor: Colors.disabledBackground,
  },
  stepperValue: {
    minWidth: 36,
    textAlign: 'center',
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.text,
  },

  /* ---- Adresses ---- */
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    paddingVertical: Spacings.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  addressSlot: {
    width: 128,
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: Colors.text,
  },
  addressFixed: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addressFixedText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.subtext2,
  },
  addressPick: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    height: 38,
    paddingHorizontal: Spacings.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.purple2,
    backgroundColor: Colors.white,
  },
  addressPickMissing: {
    borderColor: Colors.warning,
    backgroundColor: Colors.warningBackground,
  },
  addressPickText: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: Colors.purpleDark,
  },
  addressPickTextMissing: {
    color: Colors.yellowDark,
  },
});