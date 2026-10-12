import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import {
  BookingBlock,
  BookingPeriod,
  getBookingExpert,
  getExpertAvailability,
} from '../../../services/v2/BookingService';
import { BookingScreenHeader } from '../components/BookingScreenHeader';
import { useBookingDirty } from '../BookingExitGuard';
import { notify } from '../bookingActions';
import { blocksLabel, formatPrice } from '../bookingFormat';
import { MONTHS, WEEKDAYS_SHORT, formatLongDate, formatShortDate, isoDate, monthMatrix } from '../bookingDates';
import { useHideFloatingTabBar } from '../useHideFloatingTabBar';

const PERIOD_LABELS: Record<BookingPeriod, string> = { morning: 'Matin', afternoon: 'Après-midi' };

interface SelectedBlock extends BookingBlock {
  date: string;
}

const blockKey = (date: string, period: BookingPeriod) => `${date}|${period}`;

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Fuseau de l'appareil, pour prévenir quand il diffère de celui de l'expert. */
const deviceTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {
    return null;
  }
};

/**
 * Choix des demi-journées pour une offre : autant que l'offre en demande, consécutives ou non.
 * Le calendrier est chargé mois par mois, dans les bornes de réservation de l'expert.
 * S'arrête au récapitulatif : l'envoi de la demande arrive en phase 3.
 */
export const ExpertCalendarView = ({ navigation, route }) => {
  useHideFloatingTabBar(navigation);

  const expertId: number = route.params?.expertId;
  const offerId: number = route.params?.offerId;

  const { data: detail } = useQuery({
    queryKey: ['booking', 'expert', expertId],
    queryFn: () => getBookingExpert(expertId),
  });

  const offer = detail?.offers.find((o) => o.id === offerId);
  const required = offer?.blocks_count ?? 1;

  const [month, setMonth] = useState<{ year: number; month: number } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selection, setSelection] = useState<Record<string, SelectedBlock>>({});

  const selectedCount = Object.keys(selection).length;

  // Quitter l'espace (barre) ou revenir au profil avec des demi-journées choisies : confirmation.
  useBookingDirty(selectedCount > 0);

  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (selectedCount === 0) return;

      e.preventDefault();
      Alert.alert('Abandonner votre sélection ?', 'Les demi-journées choisies ne seront pas conservées.', [
        { text: 'Continuer', style: 'cancel' },
        { text: 'Abandonner', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
      ]);
    });
  }, [navigation, selectedCount]);

  // Premier mois affiché : celui du premier jour réservable.
  useEffect(() => {
    if (detail && !month) {
      const [y, m] = detail.first_date.split('-').map(Number);
      setMonth({ year: y, month: m });
    }
  }, [detail]);

  /* ---- Disponibilités du mois ---- */

  const range = useMemo(() => {
    if (!detail || !month) return null;

    const lastDay = new Date(Date.UTC(month.year, month.month, 0)).getUTCDate();
    const from = [isoDate(month.year, month.month, 1), detail.first_date].sort()[1];
    const to = [isoDate(month.year, month.month, lastDay), detail.last_date].sort()[0];

    return from <= to ? { from, to } : null;
  }, [detail, month]);

  const { data: calendar, isFetching } = useQuery({
    queryKey: ['booking', 'availability', expertId, range?.from, range?.to],
    queryFn: () => getExpertAvailability(expertId, range!),
    enabled: !!range,
  });

  const blocksByDate = useMemo(() => {
    const map: Record<string, BookingBlock[]> = {};
    for (const day of calendar?.days ?? []) {
      map[day.date] = day.blocks;
    }
    return map;
  }, [calendar]);

  /* ---- Navigation mois ---- */

  const monthIndex = (year: number, m: number) => year * 12 + m;
  const [firstY, firstM] = (detail?.first_date ?? '0-0').split('-').map(Number);
  const [lastY, lastM] = (detail?.last_date ?? '0-0').split('-').map(Number);
  const canPrev = !!month && monthIndex(month.year, month.month) > monthIndex(firstY, firstM);
  const canNext = !!month && monthIndex(month.year, month.month) < monthIndex(lastY, lastM);

  const changeMonth = (delta: number) => {
    setSelectedDate(null);
    setMonth((current) => {
      if (!current) return current;
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
      setSelection(next);
      return;
    }

    if (selectedCount >= required) {
      notify(
        'Sélection complète',
        `Ce thème compte ${blocksLabel(required)}. Retirez-en une pour en choisir une autre.`
      );
      return;
    }

    setSelection({ ...selection, [key]: { ...block, date } });
  };

  const removeSelected = (key: string) => {
    const next = { ...selection };
    delete next[key];
    setSelection(next);
  };

  const sortedSelection = Object.entries(selection).sort(([a], [b]) => a.localeCompare(b));
  const complete = selectedCount === required;

  const submit = () => {
    // Phase 3 : récapitulatif, message pour l'expert, envoi de la demande.
    notify('Bientôt disponible', "L'envoi de la demande de rendez-vous arrive prochainement.");
  };

  const tz = deviceTimezone();
  const showTzNotice = !!calendar && !!tz && tz !== calendar.timezone;

  if (!detail || !offer) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <BookingScreenHeader title="Disponibilités" onBack={() => navigation.goBack()} />
        <View style={[styles.body, styles.center]}>
          <ActivityIndicator color={Colors.lblue} />
        </View>
      </SafeAreaView>
    );
  }

  const dayBlocks = selectedDate ? blocksByDate[selectedDate] ?? [] : [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.lblue} />
      <BookingScreenHeader title="Disponibilités" onBack={() => navigation.goBack()} />

      <View style={styles.body}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* ---- Rappel du thème ---- */}
          <View style={styles.offerBar}>
            <View style={styles.flex}>
              <Text style={styles.offerTitle} numberOfLines={1}>
                {offer.title}
              </Text>
              <Text style={styles.offerMeta}>
                {detail.expert.name} · {offer.duration_label} · {formatPrice(offer.price, offer.currency)}
              </Text>
            </View>
          </View>

          {/* ---- Calendrier ---- */}
          <View style={styles.card}>
            <View style={styles.monthNav}>
              <TouchableOpacity
                style={[styles.navButton, !canPrev && styles.navButtonDisabled]}
                onPress={() => changeMonth(-1)}
                disabled={!canPrev}
                accessibilityLabel="Mois précédent"
              >
                <Ionicons name="chevron-back" size={20} color={canPrev ? Colors.lblueDark : Colors.disabledBackground} />
              </TouchableOpacity>

              <View style={styles.monthTitleWrap}>
                <Text style={styles.monthTitle}>
                  {month ? `${capitalize(MONTHS[month.month - 1])} ${month.year}` : ''}
                </Text>
                {isFetching && <ActivityIndicator size="small" color={Colors.lblue} />}
              </View>

              <TouchableOpacity
                style={[styles.navButton, !canNext && styles.navButtonDisabled]}
                onPress={() => changeMonth(1)}
                disabled={!canNext}
                accessibilityLabel="Mois suivant"
              >
                <Ionicons name="chevron-forward" size={20} color={canNext ? Colors.lblueDark : Colors.disabledBackground} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekHeader}>
              {WEEKDAYS_SHORT.slice(1).map((label, i) => (
                <Text key={i} style={styles.weekHeaderText}>{label}</Text>
              ))}
            </View>

            {month &&
              monthMatrix(month.year, month.month).map((week, w) => (
                <View key={w} style={styles.week}>
                  {week.map((date, d) => {
                    if (!date) return <View key={d} style={styles.day} />;

                    const blocks = blocksByDate[date];
                    const available = !!blocks && blocks.length > 0;
                    const active = selectedDate === date;
                    const chosen = (['morning', 'afternoon'] as BookingPeriod[]).filter((p) => selection[blockKey(date, p)]);

                    return (
                      <TouchableOpacity
                        key={d}
                        style={styles.day}
                        onPress={() => setSelectedDate(date)}
                        disabled={!available}
                        activeOpacity={0.6}
                        accessibilityLabel={formatLongDate(date)}
                        accessibilityState={{ disabled: !available, selected: active }}
                      >
                        <View
                          style={[
                            styles.dayCircle,
                            available && styles.dayAvailable,
                            chosen.length > 0 && styles.dayChosen,
                            active && styles.dayActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayNumber,
                              !available && styles.dayUnavailable,
                              (chosen.length > 0 || active) && styles.dayNumberOnColor,
                            ]}
                          >
                            {Number(date.slice(8))}
                          </Text>
                        </View>
                        {available && (
                          <View style={styles.dots}>
                            {blocks.map((block) => (
                              <View
                                key={block.period}
                                style={[styles.dot, selection[blockKey(date, block.period)] && styles.dotChosen]}
                              />
                            ))}
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}

            {!isFetching && calendar && calendar.days.length === 0 && (
              <Text style={styles.noSlot}>Aucune demi-journée libre ce mois-ci.</Text>
            )}
          </View>

          {/* ---- Demi-journées du jour choisi ---- */}
          {selectedDate && (
            <View style={styles.card}>
              <Text style={styles.dayTitle}>{capitalize(formatLongDate(selectedDate))}</Text>
              <View style={styles.blocks}>
                {dayBlocks.map((block) => {
                  const chosen = !!selection[blockKey(selectedDate, block.period)];
                  return (
                    <TouchableOpacity
                      key={block.period}
                      style={[styles.block, chosen && styles.blockChosen]}
                      onPress={() => toggleBlock(selectedDate, block)}
                      activeOpacity={0.7}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: chosen }}
                    >
                      <MaterialCommunityIcons
                        name={block.period === 'morning' ? 'weather-sunset-up' : 'weather-sunny'}
                        size={22}
                        color={chosen ? Colors.white : Colors.lblueDark}
                      />
                      <View style={styles.flex}>
                        <Text style={[styles.blockLabel, chosen && styles.textOnColor]}>{PERIOD_LABELS[block.period]}</Text>
                        <Text style={[styles.blockHours, chosen && styles.textOnColor]}>
                          {block.start_local} – {block.end_local}
                        </Text>
                      </View>
                      <Ionicons
                        name={chosen ? 'checkmark-circle' : 'ellipse-outline'}
                        size={24}
                        color={chosen ? Colors.white : Colors.disabledBackground}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {showTzNotice && (
            <View style={styles.notice}>
              <Ionicons name="globe-outline" size={16} color={Colors.subtext2} />
              <Text style={styles.noticeText}>Horaires indiqués à l'heure de l'expert ({calendar!.timezone}).</Text>
            </View>
          )}
        </ScrollView>

        {/* ---- Récapitulatif ---- */}
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>
              <Text style={styles.progressCount}>{selectedCount} / {required}</Text>{' '}
              {required > 1 ? 'demi-journées choisies' : 'demi-journée choisie'}
            </Text>
            <View style={styles.progressDots}>
              {Array.from({ length: required }).map((_, i) => (
                <View key={i} style={[styles.progressDot, i < selectedCount && styles.progressDotFilled]} />
              ))}
            </View>
          </View>

          {sortedSelection.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {sortedSelection.map(([key, block]) => (
                <TouchableOpacity key={key} style={styles.chip} onPress={() => removeSelected(key)} hitSlop={4}>
                  <Text style={styles.chipText}>
                    {formatShortDate(block.date)} · {PERIOD_LABELS[block.period].toLowerCase()}
                  </Text>
                  <Ionicons name="close" size={14} color={Colors.lblueDark} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity
            style={[styles.cta, !complete && styles.ctaDisabled]}
            onPress={submit}
            disabled={!complete}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaText}>Continuer</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  /* ---- Structure ---- */
  container: {
    flex: 1,
    backgroundColor: Colors.lblue,
  },
  body: {
    flex: 1,
    backgroundColor: Colors.grayLight,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: Spacings.md,
    paddingBottom: Spacings.xl,
    gap: Spacings.sm,
  },
  card: {
    padding: Spacings.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  textOnColor: {
    color: Colors.white,
  },

  /* ---- Rappel du thème ---- */
  offerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacings.md,
    borderRadius: 16,
    backgroundColor: Colors.lblue3,
  },
  offerTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: Colors.lblueDark,
  },
  offerMeta: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.lblueDark,
    marginTop: Spacings.xxxs,
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
    gap: 3,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayAvailable: {
    backgroundColor: Colors.lblue3,
  },
  dayChosen: {
    backgroundColor: Colors.lblue,
  },
  dayActive: {
    backgroundColor: Colors.lblueDark,
  },
  dayNumber: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.lblueDark,
  },
  dayUnavailable: {
    color: Colors.disabledBackground,
  },
  dayNumberOnColor: {
    color: Colors.white,
  },
  dots: {
    flexDirection: 'row',
    gap: 3,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.lblue2,
  },
  dotChosen: {
    backgroundColor: Colors.lblueDark,
  },
  noSlot: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.subtext2,
    textAlign: 'center',
    marginTop: Spacings.sm,
  },

  /* ---- Demi-journées du jour ---- */
  dayTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: Colors.text,
    marginBottom: Spacings.sm,
  },
  blocks: {
    gap: Spacings.xs,
  },
  block: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    padding: Spacings.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  blockChosen: {
    borderColor: Colors.lblueDark,
    backgroundColor: Colors.lblueDark,
  },
  blockLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: Colors.text,
  },
  blockHours: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.subtext2,
  },

  /* ---- Fuseau ---- */
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    paddingHorizontal: Spacings.xxs,
  },
  noticeText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.subtext2,
  },

  /* ---- Récapitulatif ---- */
  footer: {
    paddingHorizontal: Spacings.md,
    paddingTop: Spacings.sm,
    paddingBottom: Spacings.sm,
    gap: Spacings.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.subtext2,
  },
  progressCount: {
    fontFamily: 'Poppins-Bold',
    color: Colors.text,
  },
  progressDots: {
    flexDirection: 'row',
    gap: Spacings.xxs,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.lblue3,
  },
  progressDotFilled: {
    backgroundColor: Colors.lblueDark,
  },
  chips: {
    gap: Spacings.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xxs,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.xxs,
    borderRadius: 999,
    backgroundColor: Colors.lblue3,
  },
  chipText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: Colors.lblueDark,
  },
  cta: {
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.lblueDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: {
    backgroundColor: Colors.disabledBackground,
  },
  ctaText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: Colors.white,
  },
});