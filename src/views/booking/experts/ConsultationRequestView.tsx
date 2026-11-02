import React, { Fragment, useEffect, useMemo, useState } from 'react';
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

const IS_WEB = Platform.OS === 'web';
const WEB_MAX_WIDTH = 720;
const INSET = Spacings.lg;

type Where = 'calendar' | 'other';

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Demande de consultation sur mesure (mobile et web) : sujet, durée, puis horaire —
 * dans l'agenda de l'expert (heures libres toutes les 30 minutes) ou à une autre date
 * (« hors calendrier », 7 h – 21 h, l'expert accepte ou refuse). Le récapitulatif et le
 * paiement réutilisent l'écran des thèmes.
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
  const [time, setTime] = useState<{ start_local: string; end_local: string } | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (info && duration === null) setDuration(info.durations[1] ?? info.durations[0] ?? null);
  }, [info]);

  const dirty = subject.trim().length > 0 || !!time;
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

  const firstDate = detail?.first_date;
  const lastDate = detail?.last_date;
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

  // Hors calendrier : toutes les demi-heures de 7 h à 21 h, fin calculée avec la durée.
  const otherTimes = useMemo(() => {
    if (!info || !duration) return [];
    const list: { start_local: string; end_local: string }[] = [];
    for (let m = toMinutes(info.off_calendar.first_start); m <= toMinutes(info.off_calendar.last_start); m += 30) {
      list.push({ start_local: fromMinutes(m), end_local: fromMinutes(m + duration) });
    }
    return list;
  }, [info, duration]);

  const dayEnabled = (date: string) =>
    where === 'calendar' ? !!timesByDate[date]?.length : !!firstDate && !!lastDate && date >= firstDate && date <= lastDate;

  const timesFor = (date: string) => (where === 'calendar' ? timesByDate[date] ?? [] : otherTimes);

  const resetTime = () => {
    setSelectedDate(null);
    setTime(null);
  };

  const changeDuration = (next: number) => {
    if (next === duration) return;
    setDuration(next);
    // L'heure choisie peut ne plus tenir dans la demi-journée.
    setTime(null);
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

  const subjectMax = info?.subject_max ?? 2000;
  const total = info && duration ? info.price_30 * (duration / 30) : null;
  const subjectError = submitted && !subject.trim() ? 'Décrivez le sujet de votre consultation.' : null;
  const timeError = submitted && !time ? 'Choisissez un jour et une heure.' : null;

  const submit = () => {
    setSubmitted(true);
    if (!subject.trim() || !time || !selectedDate || !duration) return;

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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.grayLight} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.inner, IS_WEB && styles.innerWeb]}>
            {/* ---- En-tête ---- */}
            <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} hitSlop={8} accessibilityLabel="Retour">
              <Ionicons name="chevron-back" size={20} color={Colors.text} />
              <Text style={styles.backText}>Experts</Text>
            </TouchableOpacity>

            <View style={styles.hero}>
              <View style={[styles.avatar, { backgroundColor: expert?.palette_color ?? CONSULT_COLOR }]}>
                {expert?.avatar_url ? (
                  <Image source={{ uri: expert.avatar_url }} style={StyleSheet.absoluteFill} />
                ) : (
                  <Text style={styles.avatarText}>{initials(expert?.name ?? '')}</Text>
                )}
              </View>
              <View style={styles.flex}>
                <Text style={styles.kicker}>Consultation sur mesure</Text>
                <Text style={styles.expertName} numberOfLines={2}>
                  {[expert?.honorific, expert?.name].filter(Boolean).join(' ')}
                </Text>
                {info ? (
                  <Text style={styles.priceLine}>
                    {formatPrice(info.price_30, info.currency.toUpperCase())} les 30 minutes · en visio
                  </Text>
                ) : null}
              </View>
            </View>

            {!info ? (
              <ActivityIndicator color={CONSULT_COLOR} style={styles.loader} />
            ) : (
              <>
                {/* ---- Sujet ---- */}
                <Text style={styles.sectionTitle}>
                  Votre sujet <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.card}>
                  <TextInput
                    style={[styles.input, !!subjectError && styles.inputError]}
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
                <Text style={styles.sectionTitle}>Durée</Text>
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
                <Text style={styles.sectionTitle}>Horaire</Text>
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

                <View style={[styles.card, !!timeError && styles.cardError]}>
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
                      const open = selectedDate ? week.indexOf(selectedDate) : -1;
                      return (
                        <Fragment key={w}>
                          <View style={styles.week}>
                            {week.map((date, d) => {
                              if (!date) return <View key={d} style={styles.day} />;
                              const enabled = dayEnabled(date);
                              const active = date === selectedDate;
                              const chosen = !!time && date === selectedDate;
                              return (
                                <TouchableOpacity
                                  key={d}
                                  style={styles.day}
                                  disabled={!enabled}
                                  onPress={() => {
                                    setSelectedDate(active ? null : date);
                                    if (!active) setTime(null);
                                  }}
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

                          {open >= 0 && (
                            <View style={styles.timesPanel}>
                              <Text style={styles.timesTitle}>{capitalize(formatLongDate(selectedDate!, year))}</Text>
                              <View style={styles.times}>
                                {timesFor(selectedDate!).map((t) => {
                                  const on = time?.start_local === t.start_local;
                                  return (
                                    <TouchableOpacity
                                      key={t.start_local}
                                      style={[styles.time, on && styles.timeOn]}
                                      onPress={() => setTime({ start_local: t.start_local, end_local: t.end_local })}
                                      accessibilityRole="radio"
                                      accessibilityState={{ selected: on }}
                                    >
                                      <Text style={[styles.timeText, on && styles.chipTextOn]}>{t.start_local}</Text>
                                    </TouchableOpacity>
                                  );
                                })}
                              </View>
                            </View>
                          )}
                        </Fragment>
                      );
                    })}

                  {where === 'calendar' && !isFetching && calendar && calendar.days.length === 0 && (
                    <Text style={styles.noSlot}>
                      Aucun horaire libre ce mois-ci pour cette durée. Essayez le mois suivant ou « Autre date ».
                    </Text>
                  )}
                </View>
                {timeError ? <Text style={styles.error}>{timeError}</Text> : null}
              </>
            )}
          </View>
        </ScrollView>

        {/* ---- Pied : total et suite ---- */}
        {info ? (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacings.sm) + Spacings.sm }]}>
            <View style={[styles.footerInner, IS_WEB && styles.innerWeb]}>
              <View style={styles.flex}>
                <Text style={styles.footerLabel} numberOfLines={1}>
                  {time && selectedDate
                    ? `${capitalize(formatLongDate(selectedDate, year))} · ${time.start_local} – ${time.end_local}`
                    : duration
                      ? durationText(duration)
                      : ' '}
                </Text>
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
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    marginLeft: -4,
  },
  backText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.text,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.md,
    padding: Spacings.md,
    borderRadius: 20,
    backgroundColor: CONSULT_SOFT,
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
  priceLine: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: CONSULT_COLOR_DARK,
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
  input: {
    minHeight: 120,
    padding: Spacings.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
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
  timesPanel: {
    padding: Spacings.sm,
    marginVertical: Spacings.xs,
    borderRadius: 14,
    backgroundColor: CONSULT_SOFT,
    gap: Spacings.xs,
  },
  timesTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: CONSULT_COLOR_DARK,
  },
  times: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
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
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: Spacings.sm,
    paddingHorizontal: INSET,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
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
