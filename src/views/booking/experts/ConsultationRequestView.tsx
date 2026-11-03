import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleSheet,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import {
  ConsultationDraft,
  ConsultationTime,
  getBookingExpert,
  getConsultationSlots,
} from '../../../services/v2/BookingService';
import { useHideFloatingTabBar } from '../useHideFloatingTabBar';
import { useBookingDirty } from '../BookingExitGuard';
import { takeBookingCompleted } from '../bookingFlow';
import { confirmAction } from '../bookingActions';
import { formatPrice, initials } from '../bookingFormat';
import { MONTHS, WEEKDAYS_SHORT, formatLongDate, fromMinutes, isoDate, monthMatrix, toMinutes } from '../bookingDates';
import { CONSULT_COLOR, CONSULT_COLOR_DARK, CONSULT_SOFT, durationText } from '../bookingKinds';
import { withAlpha } from '../bookingPalette';

/** Sujet : court, l'échange se poursuit ensuite dans la messagerie (même borne que le serveur). */
const SUBJECT_MAX = 300;
const MINUTES = [0, 30];
const pad2 = (n: number) => String(n).padStart(2, '0');

const IS_WEB = Platform.OS === 'web';
const WEB_MAX_WIDTH = 720;
const INSET = Spacings.lg;

type Where = 'calendar' | 'other';

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Demande de consultation sur mesure (mobile et web) : sujet, durée estimée, puis horaire —
 * dans l'agenda de l'expert ou à une autre date (« hors calendrier », 7 h – 21 h, l'expert
 * accepte ou refuse). L'heure de début se choisit au-dessus du calendrier (heure, puis
 * minutes, en 24 h) ; dans l'agenda, heures et jours sans créneau libre sont grisés l'un
 * en fonction de l'autre. Le récapitulatif et le paiement réutilisent l'écran des thèmes.
 */
export const ConsultationRequestView = ({ navigation, route }) => {
  useHideFloatingTabBar(navigation);
  const insets = useSafeAreaInsets();

  const expertId: number = route.params?.expertId;
  const preview = route.params?.preview;

  const { data: detail, isLoading } = useQuery({
    queryKey: ['booking', 'expert', expertId],
    queryFn: () => getBookingExpert(expertId),
  });
  const expert = detail?.expert ?? preview;
  const info = detail?.consultation ?? preview?.consultation ?? null;

  /* ---- Saisie ---- */

  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState<number | null>(null);
  const [where, setWhere] = useState<Where>('calendar');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  // Heure de début choisie au-dessus du calendrier : heure puis minutes.
  const [hour, setHour] = useState<number | null>(null);
  const [minute, setMinute] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const start = hour !== null && minute !== null ? `${pad2(hour)}:${pad2(minute)}` : null;
  const time =
    start && duration ? { start_local: start, end_local: fromMinutes(toMinutes(start) + duration) } : null;
  const clearTime = () => {
    setHour(null);
    setMinute(null);
  };

  useEffect(() => {
    if (info && duration === null) setDuration(info.durations[1] ?? info.durations[0] ?? null);
  }, [info]);

  const dirty = subject.trim().length > 0 || !!time || !!selectedDate;
  useBookingDirty(dirty);

  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (takeBookingCompleted(route.key) || !dirty) return;
      e.preventDefault();
      confirmAction(
        'Abandonner votre demande ?',
        'Le sujet et l\'horaire choisis ne seront pas conservés.',
        'Abandonner',
        () => navigation.dispatch(e.data.action),
        { destructive: true, cancelText: 'Continuer' }
      );
    });
  }, [navigation, route.key, dirty]);

  /* ---- Calendrier ---- */

  // Bornes propres à la consultation (son délai minimum peut différer de celui des thèmes).
  const firstDate = info?.first_date ?? detail?.first_date;
  const lastDate = info?.last_date ?? detail?.last_date;
  const [month, setMonth] = useState<{ year: number; month: number } | null>(null);

  useEffect(() => {
    if (firstDate && !month) {
      const [y, m] = firstDate.split('-').map(Number);
      setMonth({ year: y, month: m });
    }
  }, [firstDate]);

  const range = useMemo(() => {
    if (!month || !firstDate || !lastDate) return null;
    const lastDay = new Date(Date.UTC(month.year, month.month, 0)).getUTCDate();
    const from = [isoDate(month.year, month.month, 1), firstDate].sort()[1];
    const to = [isoDate(month.year, month.month, lastDay), lastDate].sort()[0];
    return from <= to ? { from, to } : null;
  }, [month, firstDate, lastDate]);

  const { data: calendar, isFetching } = useQuery({
    queryKey: ['booking', 'consultation-slots', expertId, duration, range?.from, range?.to],
    queryFn: () => getConsultationSlots(expertId, { duration_minutes: duration!, ...range! }),
    enabled: !!range && !!duration && where === 'calendar',
  });

  const timesByDate = useMemo(() => {
    const map: Record<string, ConsultationTime[]> = {};
    for (const day of calendar?.days ?? []) map[day.date] = day.times;
    return map;
  }, [calendar]);

  // Hors calendrier : toutes les demi-heures de 7 h à 21 h.
  const otherStarts = useMemo(() => {
    if (!info) return [] as string[];
    const list: string[] = [];
    for (let m = toMinutes(info.off_calendar.first_start); m <= toMinutes(info.off_calendar.last_start); m += 30) {
      list.push(fromMinutes(m));
    }
    return list;
  }, [info]);

  // Heures de début possibles : hors calendrier toutes ; dans l'agenda, celles du jour choisi,
  // ou à défaut celles d'au moins un jour du mois affiché.
  const allowedStarts = useMemo(() => {
    if (where === 'other') return new Set(otherStarts);
    const days = selectedDate ? [timesByDate[selectedDate] ?? []] : Object.values(timesByDate);
    return new Set(days.flat().map((t) => t.start_local));
  }, [where, otherStarts, timesByDate, selectedDate]);

  // Heures affichées (24 h) : plage hors calendrier, élargie aux heures libres de l'agenda.
  const hours = useMemo(() => {
    const set = new Set(otherStarts.map((t) => Number(t.slice(0, 2))));
    Object.values(timesByDate).forEach((times) => times.forEach((t) => set.add(Number(t.start_local.slice(0, 2)))));
    return [...set].sort((a, b) => a - b);
  }, [otherStarts, timesByDate]);

  const hourEnabled = (h: number) => MINUTES.some((m) => allowedStarts.has(`${pad2(h)}:${pad2(m)}`));
  const minuteEnabled = (m: number) => hour !== null && allowedStarts.has(`${pad2(hour)}:${pad2(m)}`);

  const pickHour = (h: number) => {
    setHour(h);
    // Minutes gardées si elles restent possibles, sinon les premières possibles.
    const keep = minute !== null && allowedStarts.has(`${pad2(h)}:${pad2(minute)}`);
    if (!keep) setMinute(MINUTES.find((m) => allowedStarts.has(`${pad2(h)}:${pad2(m)}`)) ?? null);
  };

  // Boutons − / + : on passe à l'heure (ou aux minutes) possible suivante ; sans choix,
  // + part de la première et − de la dernière.
  const openHours = hours.filter(hourEnabled);
  const nextHour = (dir: 1 | -1): number | null => {
    if (hour === null) return dir > 0 ? openHours[0] ?? null : openHours[openHours.length - 1] ?? null;
    const list = dir > 0 ? openHours : [...openHours].reverse();
    return list.find((h) => (dir > 0 ? h > hour : h < hour)) ?? null;
  };
  const openMinutes = MINUTES.filter(minuteEnabled);
  const nextMinute = (dir: 1 | -1): number | null => {
    if (hour === null || minute === null) return null;
    const list = dir > 0 ? openMinutes : [...openMinutes].reverse();
    return list.find((m) => (dir > 0 ? m > minute : m < minute)) ?? null;
  };
  const stepHour = (dir: 1 | -1) => {
    const next = nextHour(dir);
    if (next !== null) pickHour(next);
  };
  const stepMinute = (dir: 1 | -1) => {
    const next = nextMinute(dir);
    if (next !== null) setMinute(next);
  };

  const inRange = (date: string) => !!firstDate && !!lastDate && date >= firstDate && date <= lastDate;
  // Agenda : un jour est possible s'il a une heure libre, et l'heure choisie s'il y en a une.
  const dayEnabled = (date: string) =>
    where === 'calendar'
      ? !!timesByDate[date]?.length && (!start || timesByDate[date].some((t) => t.start_local === start))
      : inRange(date);

  // Durée changée : l'heure ou le jour choisis peuvent ne plus être libres.
  useEffect(() => {
    if (where !== 'calendar' || !calendar || !start) return;
    if (selectedDate && !timesByDate[selectedDate]?.some((t) => t.start_local === start)) setSelectedDate(null);
  }, [calendar]);

  const resetTime = () => {
    setSelectedDate(null);
    clearTime();
  };

  const changeDuration = (next: number) => {
    if (next === duration) return;
    setDuration(next);
  };

  const changeWhere = (next: Where) => {
    if (next === where) return;
    setWhere(next);
    resetTime();
  };

  const canMonth = (delta: number) => {
    if (!month || !firstDate || !lastDate) return false;
    const index = month.year * 12 + month.month + delta;
    const [fy, fm] = firstDate.split('-').map(Number);
    const [ly, lm] = lastDate.split('-').map(Number);
    return index >= fy * 12 + fm && index <= ly * 12 + lm;
  };

  const changeMonth = (delta: number) => {
    if (!month || !canMonth(delta)) return;
    const index = month.year * 12 + (month.month - 1) + delta;
    setMonth({ year: Math.floor(index / 12), month: (index % 12) + 1 });
    setSelectedDate(null);
  };

  /* ---- Envoi ---- */

  const subjectMax = Math.min(info?.subject_max ?? SUBJECT_MAX, SUBJECT_MAX);
  const total = info && duration ? info.price_30 * (duration / 30) : null;
  const subjectError = submitted && !subject.trim() ? 'Décrivez le sujet de votre consultation.' : null;
  const timeError = submitted && (!time || !selectedDate) ? 'Choisissez une heure et un jour.' : null;

  // Continuer avec un champ manquant : on remonte jusqu'à lui (sujet d'abord, puis horaire).
  const scrollRef = useRef<ScrollView>(null);
  const subjectRef = useRef<TextInput>(null);
  const innerY = useRef(0);
  const sectionY = useRef<{ subject: number; time: number }>({ subject: 0, time: 0 });
  const scrollToSection = (key: 'subject' | 'time') =>
    scrollRef.current?.scrollTo({ y: Math.max(0, innerY.current + sectionY.current[key] - Spacings.md), animated: true });

  const submit = () => {
    setSubmitted(true);
    if (!subject.trim()) {
      scrollToSection('subject');
      // Après le défilement : le clavier ne doit pas l'interrompre.
      setTimeout(() => subjectRef.current?.focus(), 350);
      return;
    }
    if (!time || !selectedDate) {
      scrollToSection('time');
      return;
    }
    if (!duration) return;

    const draft: ConsultationDraft = {
      duration_minutes: duration,
      date: selectedDate,
      start_local: time.start_local,
      end_local: time.end_local,
      subject: subject.trim(),
      off_calendar: where === 'other',
    };

    navigation.navigate('expert-checkout', {
      expertId,
      expert: {
        name: expert?.name,
        honorific: expert?.honorific,
        avatar_url: expert?.avatar_url,
        palette: expert?.palette,
        palette_color: expert?.palette_color,
      },
      consultation: draft,
      offerRouteKey: route.key,
    });
  };

  /* ---- Rendu ---- */

  if (!info && !isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>Cet expert ne propose pas de consultation pour le moment.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.linkButton}>
            <Text style={styles.linkText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const year = new Date().getFullYear();

  // Réglage − valeur + (heure ou minutes).
  const stepper = (
    value: string,
    onMinus: () => void,
    onPlus: () => void,
    canMinus: boolean,
    canPlus: boolean,
    label: string
  ) => (
    <View style={styles.stepper}>
      <TouchableOpacity
        style={[styles.stepButton, !canMinus && styles.stepButtonOff]}
        onPress={onMinus}
        disabled={!canMinus}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`${label} précédente`}
      >
        <Ionicons name="remove" size={20} color={canMinus ? CONSULT_COLOR_DARK : Colors.border} />
      </TouchableOpacity>
      <Text style={[styles.stepValue, value === '--' && styles.stepValueEmpty]}>{value}</Text>
      <TouchableOpacity
        style={[styles.stepButton, !canPlus && styles.stepButtonOff]}
        onPress={onPlus}
        disabled={!canPlus}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`${label} suivante`}
      >
        <Ionicons name="add" size={20} color={canPlus ? CONSULT_COLOR_DARK : Colors.border} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.grayLight} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[styles.inner, IS_WEB && styles.innerWeb]}
            onLayout={(e) => (innerY.current = e.nativeEvent.layout.y)}
          >
            {/* ---- En-tête : titre, fermeture à droite ---- */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Consultation sur mesure</Text>
              <TouchableOpacity
                style={[styles.close, { borderColor: withAlpha(CONSULT_COLOR, 0.45), backgroundColor: withAlpha(CONSULT_COLOR, 0.1) }]}
                onPress={() => navigation.goBack()}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Fermer"
              >
                <Ionicons name="close" size={26} color={CONSULT_COLOR} />
              </TouchableOpacity>
            </View>

            {/* ---- Expert : titre, nom, références ---- */}
            <View style={styles.hero}>
              <View style={[styles.avatar, { backgroundColor: expert?.palette_color ?? CONSULT_COLOR }]}>
                {expert?.avatar_url ? (
                  <Image source={{ uri: expert.avatar_url }} style={StyleSheet.absoluteFill} />
                ) : (
                  <Text style={styles.avatarText}>{initials(expert?.name ?? '')}</Text>
                )}
              </View>
              <View style={styles.flex}>
                {expert?.honorific ? (
                  <Text style={[styles.kicker, { color: expert?.palette_color ?? CONSULT_COLOR }]} numberOfLines={1}>
                    {expert.honorific}
                  </Text>
                ) : null}
                <Text style={styles.expertName} numberOfLines={2}>
                  {expert?.name ?? ''}
                </Text>
                {expert?.credentials ? (
                  <Text style={styles.credentials} numberOfLines={2}>
                    {expert.credentials}
                  </Text>
                ) : null}
              </View>
            </View>

            {!info ? (
              <ActivityIndicator color={CONSULT_COLOR} style={styles.loader} />
            ) : (
              <>
                {/* ---- Sujet ---- */}
                <Text
                  style={styles.sectionTitle}
                  onLayout={(e) => (sectionY.current.subject = e.nativeEvent.layout.y)}
                >
                  Votre sujet <Text style={styles.required}>*</Text>
                </Text>
                <View>
                  <TextInput
                    ref={subjectRef}
                    style={[styles.input, !!subjectError && styles.inputError, IS_WEB && ({ outlineStyle: 'none' } as any)]}
                    value={subject}
                    onChangeText={setSubject}
                    placeholder="Décrivez votre question, le cas, ce que vous attendez de l'échange…"
                    placeholderTextColor={Colors.subtext}
                    multiline
                    textAlignVertical="top"
                    maxLength={subjectMax}
                  />
                  <View style={styles.inputFoot}>
                    {subjectError ? <Text style={styles.error}>{subjectError}</Text> : <View />}
                    <Text style={styles.counter}>
                      {subject.length} / {subjectMax}
                    </Text>
                  </View>
                </View>

                {/* ---- Durée ---- */}
                <Text style={styles.sectionTitle}>Durée estimée</Text>
                <View style={styles.chips}>
                  {info.durations.map((minutes) => {
                    const on = minutes === duration;
                    return (
                      <TouchableOpacity
                        key={minutes}
                        style={[styles.chip, on && styles.chipOn]}
                        onPress={() => changeDuration(minutes)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: on }}
                      >
                        <Text style={[styles.chipTitle, on && styles.chipTextOn]}>{durationText(minutes)}</Text>
                        <Text style={[styles.chipSub, on && styles.chipTextOn]}>
                          {formatPrice(info.price_30 * (minutes / 30), info.currency.toUpperCase())}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* ---- Horaire ---- */}
                <Text style={styles.sectionTitle} onLayout={(e) => (sectionY.current.time = e.nativeEvent.layout.y)}>
                  Horaire
                </Text>
                <View style={styles.segment}>
                  {(['calendar', 'other'] as Where[]).map((key) => {
                    const on = key === where;
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[styles.segmentItem, on && styles.segmentItemOn]}
                        onPress={() => changeWhere(key)}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: on }}
                      >
                        <Ionicons
                          name={key === 'calendar' ? 'calendar-outline' : 'calendar-clear-outline'}
                          size={16}
                          color={on ? Colors.white : CONSULT_COLOR_DARK}
                        />
                        <Text style={[styles.segmentText, on && styles.segmentTextOn]}>
                          {key === 'calendar' ? "Agenda de l'expert" : 'Autre date'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {where === 'other' ? (
                  <View style={styles.note}>
                    <Ionicons name="information-circle-outline" size={16} color={CONSULT_COLOR_DARK} />
                    <Text style={styles.noteText}>
                      Hors calendrier : proposez le jour et l'heure qui vous conviennent, l'expert accepte ou refuse.
                    </Text>
                  </View>
                ) : null}

                {/* ---- Heure de début (24 h) : une ligne heure : minutes, réglée avec − / + ---- */}
                {timeError ? <Text style={styles.error}>{timeError}</Text> : null}
                <View style={[styles.card, styles.timeCard, submitted && !time && styles.cardError]}>
                  <Text style={styles.pickerLabel}>Heure de début</Text>
                  <View style={styles.stepperRow}>
                    {stepper(
                      hour !== null ? pad2(hour) : '--',
                      () => stepHour(-1),
                      () => stepHour(1),
                      nextHour(-1) !== null,
                      nextHour(1) !== null,
                      'heure'
                    )}
                    <Text style={styles.stepperColon}>:</Text>
                    {stepper(
                      minute !== null && hour !== null ? pad2(minute) : '--',
                      () => stepMinute(-1),
                      () => stepMinute(1),
                      nextMinute(-1) !== null,
                      nextMinute(1) !== null,
                      'minutes'
                    )}
                    {time ? (
                      <View style={styles.stepperEnd}>
                        <Ionicons name="arrow-forward" size={14} color={Colors.subtext2} />
                        <Text style={styles.stepperEndText}>{time.end_local}</Text>
                      </View>
                    ) : null}
                  </View>
                  {where === 'calendar' && openHours.length === 0 && calendar ? (
                    <Text style={styles.pickerHint}>Aucune heure libre ce mois-ci pour cette durée.</Text>
                  ) : null}
                </View>

                <View style={[styles.card, submitted && !selectedDate && styles.cardError]}>
                  <View style={styles.monthNav}>
                    <TouchableOpacity
                      style={[styles.navButton, canMonth(-1) && styles.navButtonOn]}
                      onPress={() => changeMonth(-1)}
                      disabled={!canMonth(-1)}
                      accessibilityLabel="Mois précédent"
                    >
                      <Ionicons name="chevron-back" size={20} color={canMonth(-1) ? CONSULT_COLOR : Colors.border} />
                    </TouchableOpacity>
                    <View style={styles.monthTitleWrap}>
                      <Text style={styles.monthTitle}>
                        {month ? `${capitalize(MONTHS[month.month - 1])} ${month.year}` : ' '}
                      </Text>
                      {isFetching && <ActivityIndicator size="small" color={CONSULT_COLOR} />}
                    </View>
                    <TouchableOpacity
                      style={[styles.navButton, canMonth(1) && styles.navButtonOn]}
                      onPress={() => changeMonth(1)}
                      disabled={!canMonth(1)}
                      accessibilityLabel="Mois suivant"
                    >
                      <Ionicons name="chevron-forward" size={20} color={canMonth(1) ? CONSULT_COLOR : Colors.border} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.weekHeader}>
                    {WEEKDAYS_SHORT.slice(1).map((label, i) => (
                      <Text key={i} style={styles.weekHeaderText}>
                        {label}
                      </Text>
                    ))}
                  </View>

                  {month &&
                    monthMatrix(month.year, month.month).map((week, w) => {
                      return (
                        <Fragment key={w}>
                          <View style={styles.week}>
                            {week.map((date, d) => {
                              if (!date) return <View key={d} style={styles.day} />;
                              const enabled = dayEnabled(date);
                              const active = date === selectedDate;
                              const chosen = active;
                              return (
                                <TouchableOpacity
                                  key={d}
                                  style={styles.day}
                                  disabled={!enabled}
                                  onPress={() => setSelectedDate(active ? null : date)}
                                  accessibilityLabel={formatLongDate(date)}
                                >
                                  <View
                                    style={[
                                      styles.dayCircle,
                                      enabled && styles.dayCircleOn,
                                      (active || chosen) && styles.dayCircleActive,
                                      where === 'other' && enabled && !active && styles.dayCircleOther,
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.dayNumber,
                                        { color: active || chosen ? Colors.white : enabled ? CONSULT_COLOR_DARK : Colors.border },
                                      ]}
                                    >
                                      {Number(date.slice(8))}
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                              );
                            })}
                          </View>

                        </Fragment>
                      );
                    })}

                  {where === 'calendar' && !isFetching && calendar && calendar.days.length === 0 && (
                    <Text style={styles.noSlot}>
                      Aucun horaire libre ce mois-ci pour cette durée. Essayez le mois suivant ou « Autre date ».
                    </Text>
                  )}
                </View>
              </>
            )}
          </View>
        </ScrollView>

        {/* ---- Pied : total et suite ---- */}
        {info ? (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacings.sm) + Spacings.sm }]}>
            <View style={[styles.footerInner, IS_WEB && styles.innerWeb]}>
              <View style={styles.flex}>
                {/* Jour, puis début et fin choisis, au-dessus du prix. */}
                <View style={styles.footerLine}>
                  <Ionicons name="calendar-outline" size={14} color={selectedDate ? CONSULT_COLOR_DARK : Colors.subtext} />
                  <Text style={[styles.footerLabel, !!selectedDate && styles.footerLabelOn]} numberOfLines={1}>
                    {selectedDate ? capitalize(formatLongDate(selectedDate, year)) : 'Jour à choisir'}
                  </Text>
                </View>
                <View style={styles.footerLine}>
                  <Ionicons name="time-outline" size={14} color={time ? CONSULT_COLOR_DARK : Colors.subtext} />
                  <Text style={[styles.footerLabel, !!time && styles.footerLabelOn]} numberOfLines={1}>
                    {time ? `${time.start_local} – ${time.end_local}` : 'Heure à choisir'}
                    {duration ? ` · ${durationText(duration)}` : ''}
                  </Text>
                </View>
                <Text style={styles.footerTotal}>
                  {total !== null ? formatPrice(total, info.currency.toUpperCase()) : ' '}
                </Text>
              </View>
              <TouchableOpacity style={styles.cta} onPress={submit} accessibilityRole="button">
                <Text style={styles.ctaText}>Continuer</Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.grayLight,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacings.lg,
    gap: Spacings.md,
  },
  emptyText: {
    fontFamily: 'Roboto',
    fontSize: 15,
    color: Colors.subtext2,
    textAlign: 'center',
  },
  linkButton: {
    padding: Spacings.sm,
  },
  linkText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: CONSULT_COLOR,
  },
  loader: {
    marginVertical: Spacings.xl,
  },
  content: {
    paddingHorizontal: INSET,
    paddingTop: Spacings.md,
  },
  inner: {
    gap: Spacings.sm,
  },
  innerWeb: {
    width: '100%',
    maxWidth: WEB_MAX_WIDTH,
    alignSelf: 'center',
  },

  /* ---- En-tête ---- */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacings.md,
    marginBottom: Spacings.xs,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    lineHeight: 32,
    color: Colors.text,
  },
  // Même gabarit que le bouton de fermeture du profil expert.
  close: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.md,
    padding: Spacings.md,
    borderRadius: 20,
    backgroundColor: Colors.white,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: Colors.white,
  },
  kicker: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: CONSULT_COLOR,
  },
  expertName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    lineHeight: 26,
    color: Colors.text,
  },
  credentials: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.subtext2,
  },

  /* ---- Sections ---- */
  sectionTitle: {
    marginTop: Spacings.md,
    fontFamily: 'Poppins-Bold',
    fontSize: 17,
    color: Colors.text,
  },
  required: {
    color: Colors.danger,
  },
  card: {
    padding: Spacings.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  cardError: {
    borderColor: Colors.danger,
  },
  // Un seul champ, posé directement sur le fond (pas de carte autour).
  input: {
    minHeight: 110,
    padding: Spacings.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    fontFamily: 'Roboto',
    fontSize: 15,
    lineHeight: 21,
    color: Colors.text,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  inputFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacings.xxs,
    paddingHorizontal: Spacings.xxs,
  },
  counter: {
    fontFamily: 'Roboto',
    fontSize: 12,
    color: Colors.subtext,
  },
  error: {
    fontFamily: 'Roboto',
    fontSize: 13,
    color: Colors.danger,
  },

  /* ---- Durée ---- */
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.xs,
  },
  chip: {
    minWidth: 84,
    paddingHorizontal: Spacings.md,
    paddingVertical: Spacings.xs,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  chipOn: {
    backgroundColor: CONSULT_COLOR,
    borderColor: CONSULT_COLOR,
  },
  chipTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: Colors.text,
  },
  chipSub: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.subtext2,
  },
  chipTextOn: {
    color: Colors.white,
  },

  /* ---- Agenda / Autre date ---- */
  segment: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    padding: 4,
    gap: 4,
    borderRadius: 14,
    backgroundColor: CONSULT_SOFT,
  },
  segmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacings.md,
    paddingVertical: Spacings.xs,
    borderRadius: 10,
  },
  segmentItemOn: {
    backgroundColor: CONSULT_COLOR,
  },
  segmentText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: CONSULT_COLOR_DARK,
  },
  segmentTextOn: {
    color: Colors.white,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  noteText: {
    flex: 1,
    fontFamily: 'Roboto',
    fontSize: 13,
    lineHeight: 18,
    color: CONSULT_COLOR_DARK,
  },

  /* ---- Calendrier ---- */
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
  navButtonOn: {
    backgroundColor: CONSULT_SOFT,
  },
  monthTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  monthTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 17,
    color: Colors.text,
  },
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
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleOn: {
    backgroundColor: CONSULT_SOFT,
  },
  dayCircleOther: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: CONSULT_COLOR,
  },
  dayCircleActive: {
    backgroundColor: CONSULT_COLOR,
    borderWidth: 0,
  },
  dayNumber: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  /* ---- Heure de début ---- */
  timeCard: {
    gap: Spacings.xs,
  },
  pickerLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: Colors.subtext2,
  },
  pickerHint: {
    fontFamily: 'Roboto',
    fontSize: 13,
    color: Colors.subtext,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacings.xs,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    padding: 4,
    borderRadius: 14,
    backgroundColor: CONSULT_SOFT,
  },
  stepButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  // Grisé mais visible : la ligne garde sa forme aux bornes.
  stepButtonOff: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  stepValue: {
    minWidth: 40,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: Colors.text,
  },
  stepValueEmpty: {
    color: Colors.subtext,
  },
  stepperColon: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: Colors.text,
  },
  stepperEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: Spacings.xs,
  },
  stepperEndText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: Colors.subtext2,
  },
  time: {
    minWidth: 64,
    paddingHorizontal: Spacings.sm,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CONSULT_COLOR,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  timeOn: {
    backgroundColor: CONSULT_COLOR,
  },
  timeText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: CONSULT_COLOR_DARK,
  },
  noSlot: {
    marginTop: Spacings.sm,
    fontFamily: 'Roboto',
    fontSize: 13,
    textAlign: 'center',
    color: Colors.subtext,
  },

  /* ---- Pied ---- */
  // Semi-transparent : le contenu se devine dessous en défilant (flouté sur le web).
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: Spacings.sm,
    paddingHorizontal: INSET,
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...(IS_WEB ? ({ backdropFilter: 'blur(12px)' } as any) : null),
  },
  footerLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerLabelOn: {
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  footerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.md,
  },
  footerLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.subtext2,
  },
  footerTotal: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: Colors.text,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    height: 52,
    paddingHorizontal: Spacings.lg,
    borderRadius: 26,
    backgroundColor: CONSULT_COLOR,
  },
  ctaText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: Colors.white,
  },
});
