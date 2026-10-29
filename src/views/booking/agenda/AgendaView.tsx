import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  FlatList,
  TouchableOpacity,
  Pressable,
  Image,
  RefreshControl,
  StyleSheet,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import { BouncingDots } from '../../../component/LoadingDots';
import { useFloatingTabBarInset } from '../../../component/booking/FloatingTabBar';
import {
  AgendaPendingRequest,
  AgendaSession,
  BookingExpertBase,
  BookingMode,
  getExpertAgenda,
} from '../../../services/v2/BookingService';
import { MONTHS, WEEKDAYS, addDays, formatLongDate, weekdayIso } from '../bookingDates';
import { accentOf, tint, withAlpha } from '../bookingPalette';
import { useBookingSetup } from '../useBookingSetup';
import { JoinVisioButton } from '../components/JoinVisioButton';
import { PERIOD_ICONS, PERIOD_LABELS } from '../experts/components/SlotPicker';
import { relativeDay, todayLocal } from '../appointments/appointmentFormat';

const LIST_PADDING = Spacings.lg;
/** Semaines proposées dans le bandeau : de la semaine en cours à environ 6 mois. */
const WEEKS_AHEAD = 27;

export const EXPERT_AGENDA_KEY = ['booking', 'expert-agenda'];

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Lundi de la semaine d'une date (Y-m-d). */
const mondayOf = (iso: string) => addDays(iso, 1 - weekdayIso(iso));

/** « Aujourd'hui · 09:00 », « Demain · 14:00 », « Dans 5 jours · 09:00 ». */
const whenLabel = (session: AgendaSession) => `${relativeDay(session.date)} · ${session.start_local}`;

/** « Dr Martin » : titre éventuel devant le nom. */
const expertName = (expert: BookingExpertBase | null) =>
  expert ? [expert.honorific, expert.name].filter(Boolean).join(' ') : 'Expert';

const MODE_META: Record<BookingMode, { icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }> = {
  online: { icon: 'video-outline', color: Colors.lblueDark },
  onsite: { icon: 'map-marker-outline', color: Colors.purpleDark },
};

/** « En ligne », ou le lieu en présentiel : « Cabinet A · Lyon ». */
const placeLabel = (session: AgendaSession) => {
  if (session.mode !== 'onsite') return 'En ligne';
  const l = session.location;
  if (!l) return 'En présentiel';
  return [l.label, l.city].filter(Boolean).join(' · ') || 'En présentiel';
};

/* ---- Qui demande, qui anime ---- */

/** Avatar rond de l'expert rencontré ; initiales si pas de photo. */
const MiniAvatar = ({ expert, color }: { expert: BookingExpertBase | null; color: string }) =>
  expert?.avatar_url ? (
    <Image source={{ uri: expert.avatar_url }} style={styles.avatar} />
  ) : (
    <View style={[styles.avatar, { backgroundColor: withAlpha(color, 0.15) }]}>
      <Text style={[styles.avatarText, { color }]}>{(expert?.name ?? '?').charAt(0).toUpperCase()}</Text>
    </View>
  );

/**
 * Pied de carte : « Demandeur : X » à gauche, « Expert : Moi » ou l'expert réservé à droite.
 * Hôte : le confrère demande, l'expert c'est moi. Invité : l'inverse.
 */
const Parties = ({
  guest,
  requesterName,
  expert,
  color,
}: {
  guest: boolean;
  requesterName: string | null;
  expert: BookingExpertBase | null;
  color: string;
}) => (
  <View style={styles.parties}>
    <Text style={styles.party} numberOfLines={1}>
      Demandeur : <Text style={[styles.partyName, !guest ? null : styles.partyMe]}>{guest ? 'Moi' : requesterName ?? 'Confrère'}</Text>
    </Text>
    <View style={styles.partyExpert}>
      {guest ? <MiniAvatar expert={expert} color={color} /> : null}
      <Text style={styles.party} numberOfLines={1}>
        Expert : <Text style={[styles.partyName, guest ? null : styles.partyMe]}>{guest ? expertName(expert) : 'Moi'}</Text>
      </Text>
    </View>
  </View>
);

/**
 * Agenda de l'expert, des deux côtés dans une seule liste :
 * les rendez-vous qu'il anime (un confrère a réservé) et ceux qu'il a réservés auprès d'un confrère.
 * Chaque carte dit qui demande et qui est l'expert ; la fiche ouverte dépend du rôle.
 *
 * Prochaine séance mise en avant, demandes envoyées sans réponse, bandeau de la semaine
 * (points matin / après-midi pour les demi-journées réservées), puis séances par jour.
 * Les rendez-vous passés sont dans l'historique (bouton en haut à droite).
 */
export const AgendaView = ({ navigation }) => {
  const bottomInset = useFloatingTabBarInset();
  const { width } = useWindowDimensions();
  const { setup } = useBookingSetup();
  const accent = accentOf(setup?.expert?.palette_color);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: EXPERT_AGENDA_KEY,
    queryFn: async () => {
      const result = await getExpertAgenda();
      if (!result) throw new Error('agenda');
      return result;
    },
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Indicateur réservé au tirage manuel (voir AppointmentsView).
  const [pulling, setPulling] = useState(false);
  const pullToRefresh = async () => {
    setPulling(true);
    try {
      await refetch();
    } finally {
      setPulling(false);
    }
  };

  const sessions = data?.sessions ?? [];
  const pending = data?.pending ?? [];
  const next = sessions[0];

  /** Couleur d'une séance : la mienne quand j'anime, celle du confrère quand j'ai réservé. */
  const colorOf = (session: AgendaSession) =>
    session.role === 'guest' ? accentOf(session.expert?.palette_color) : accent;

  /* ---- Regroupement par jour ---- */

  const sections = useMemo(() => {
    const byDay = new Map<string, AgendaSession[]>();
    sessions.forEach((s) => byDay.set(s.date, [...(byDay.get(s.date) ?? []), s]));
    return [...byDay.entries()].map(([date, items]) => ({ key: date, date, data: items }));
  }, [sessions]);

  const bookedByDay = useMemo(() => {
    const map = new Map<string, Set<string>>();
    sessions.forEach((s) => map.set(s.date, (map.get(s.date) ?? new Set()).add(s.period)));
    return map;
  }, [sessions]);

  /* ---- Bandeau de la semaine ---- */

  const today = todayLocal();
  const weeks = useMemo(() => {
    const first = mondayOf(today);
    return Array.from({ length: WEEKS_AHEAD }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(first, w * 7 + d)));
  }, [today]);

  // Jour choisi dans le bandeau : la liste ne montre plus que ce jour (re-toucher pour tout revoir).
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [weekIndex, setWeekIndex] = useState(0);
  const stripRef = useRef<FlatList<string[]>>(null);
  const stripWidth = width - LIST_PADDING * 2;

  const selectDay = (date: string) => setSelectedDay((current) => (current === date ? null : date));

  const goToWeek = (index: number) => {
    const target = Math.max(0, Math.min(WEEKS_AHEAD - 1, index));
    setWeekIndex(target);
    stripRef.current?.scrollToIndex({ index: target, animated: true });
  };

  const visibleSections = selectedDay ? sections.filter((section) => section.date === selectedDay) : sections;

  // Mois de la semaine affichée : celui de son jeudi (règle ISO), pour les semaines à cheval.
  const weekMonth = (() => {
    const thursday = weeks[weekIndex]?.[3];
    if (!thursday) return '';
    const [y, m] = thursday.split('-').map(Number);
    return `${capitalize(MONTHS[m - 1])} ${y}`;
  })();

  // Le rôle vient du serveur : j'anime → fiche de la demande reçue (accepter, signaler…) ;
  // j'ai réservé → fiche du demandeur (paiement, annulation, informations d'accès).
  const openSession = (session: AgendaSession) =>
    session.role === 'guest'
      ? navigation.navigate('appointment-detail', { bookingId: session.booking_id })
      : navigation.navigate('request-detail', { bookingId: session.booking_id });

  const openPending = (booking: AgendaPendingRequest) =>
    navigation.navigate('appointment-detail', { bookingId: booking.id, preview: booking });

  const nextColor = next ? colorOf(next) : accent;

  /* ---- En-tête de liste ---- */

  const header = (
    <View>
      <View style={styles.head}>
        <Text style={styles.title}>Agenda</Text>
        <TouchableOpacity
          style={[styles.historyButton, { borderColor: withAlpha(accent, 0.45), backgroundColor: withAlpha(accent, 0.1) }]}
          onPress={() => navigation.navigate('agenda-history')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Rendez-vous passés"
        >
          <MaterialCommunityIcons name="history" size={24} color={accent} />
        </TouchableOpacity>
      </View>

      {/* ---- Prochaine séance ---- */}
      {next ? (
        <Pressable
          style={({ pressed }) => [styles.next, { backgroundColor: tint(nextColor, 0.14) }, pressed && styles.pressed]}
          onPress={() => openSession(next)}
        >
          <View style={styles.nextHead}>
            <Text style={[styles.nextKicker, { color: nextColor }]}>Prochaine séance</Text>
            <Text style={[styles.nextWhen, { color: nextColor }]}>{whenLabel(next)}</Text>
          </View>
          <Text style={styles.nextTitle} numberOfLines={2}>
            {next.offer_title}
          </Text>
          <View style={styles.nextMeta}>
            <MaterialCommunityIcons name={PERIOD_ICONS[next.period]} size={16} color={Colors.lblueDark} />
            <Text style={styles.nextMetaText}>
              {capitalize(formatLongDate(next.date, new Date().getFullYear()))} · {PERIOD_LABELS[next.period]}{' '}
              {next.start_local} – {next.end_local}
            </Text>
          </View>
          <View style={styles.nextMeta}>
            <MaterialCommunityIcons name={MODE_META[next.mode].icon} size={16} color={MODE_META[next.mode].color} />
            <Text style={styles.nextMetaText} numberOfLines={1}>
              {placeLabel(next)}
              {next.total > 1 ? ` · Séance ${next.index} / ${next.total}` : ''}
            </Text>
          </View>
          <Parties
            guest={next.role === 'guest'}
            requesterName={next.requester.name}
            expert={next.expert}
            color={nextColor}
          />
          {/* Visio seulement en ligne ; en présentiel l'adresse est dans la fiche. */}
          {next.mode === 'online' ? (
            <View style={styles.nextJoin}>
              <JoinVisioButton startAt={next.start_at} endAt={next.end_at} url={next.meet_url} color={nextColor} />
            </View>
          ) : null}
        </Pressable>
      ) : null}

      {/* ---- Demandes envoyées à un confrère, sans réponse ---- */}
      {!selectedDay && pending.length > 0 ? (
        <View>
          <Text style={styles.sectionTitle}>
            En attente de réponse <Text style={{ color: accent }}>({pending.length})</Text>
          </Text>
          <View style={styles.pendingList}>
            {pending.map((booking) => {
              const color = accentOf(booking.expert?.palette_color);
              const first = booking.blocks[0];
              return (
                <Pressable
                  key={booking.id}
                  style={({ pressed }) => [styles.row, styles.rowColumn, pressed && styles.pressed]}
                  onPress={() => openPending(booking)}
                  accessibilityRole="button"
                >
                  <View style={[styles.rowBar, { backgroundColor: withAlpha(color, 0.5) }]} />
                  <View style={styles.pendingHead}>
                    <Text style={[styles.rowTitle, styles.flex]} numberOfLines={2}>
                      {booking.offer_title}
                    </Text>
                    <View style={[styles.pendingBadge, { backgroundColor: withAlpha(color, 0.12) }]}>
                      <MaterialCommunityIcons name="timer-sand" size={13} color={color} />
                      <Text style={[styles.pendingBadgeText, { color }]}>En attente</Text>
                    </View>
                  </View>
                  {first ? (
                    <View style={styles.rowMeta}>
                      <MaterialCommunityIcons
                        name={MODE_META[booking.mode ?? 'online'].icon}
                        size={14}
                        color={MODE_META[booking.mode ?? 'online'].color}
                      />
                      <Text style={styles.rowMetaText} numberOfLines={1}>
                        {capitalize(formatLongDate(first.date, new Date().getFullYear()))}
                        {booking.blocks_count > 1 ? ` · ${booking.blocks_count} séances` : ''}
                      </Text>
                    </View>
                  ) : null}
                  <Parties guest requesterName={null} expert={booking.expert} color={color} />
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* ---- Bandeau de la semaine ---- */}
      {sessions.length > 0 ? (
        <View style={styles.stripHead}>
          <TouchableOpacity
            style={styles.stripArrow}
            onPress={() => goToWeek(weekIndex - 1)}
            disabled={weekIndex === 0}
            hitSlop={8}
            accessibilityLabel="Semaine précédente"
          >
            <Ionicons name="chevron-back" size={20} color={weekIndex === 0 ? Colors.border : accent} />
          </TouchableOpacity>
          <Text style={styles.stripMonth}>{weekMonth}</Text>
          <TouchableOpacity
            style={styles.stripArrow}
            onPress={() => goToWeek(weekIndex + 1)}
            disabled={weekIndex === WEEKS_AHEAD - 1}
            hitSlop={8}
            accessibilityLabel="Semaine suivante"
          >
            <Ionicons name="chevron-forward" size={20} color={weekIndex === WEEKS_AHEAD - 1 ? Colors.border : accent} />
          </TouchableOpacity>
        </View>
      ) : null}
      {sessions.length > 0 ? (
        <FlatList
          ref={stripRef}
          data={weeks}
          onMomentumScrollEnd={(e) => setWeekIndex(Math.round(e.nativeEvent.contentOffset.x / stripWidth))}
          keyExtractor={(week) => week[0]}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.strip}
          getItemLayout={(_, index) => ({ length: stripWidth, offset: stripWidth * index, index })}
          renderItem={({ item: week }) => (
            <View style={[styles.week, { width: stripWidth }]}>
              {week.map((date) => {
                const booked = bookedByDay.get(date);
                const isToday = date === today;
                const selected = date === selectedDay;
                return (
                  <Pressable
                    key={date}
                    style={[styles.day, selected && { backgroundColor: accent }]}
                    onPress={() => selectDay(date)}
                    accessibilityLabel={formatLongDate(date)}
                  >
                    <Text style={[styles.dayLetter, selected && styles.dayTextSelected]}>
                      {WEEKDAYS[weekdayIso(date)].charAt(0)}
                    </Text>
                    <Text
                      style={[
                        styles.dayNumber,
                        !booked && styles.dayNumberIdle,
                        isToday && !selected && { color: accent },
                        selected && styles.dayTextSelected,
                      ]}
                    >
                      {Number(date.slice(8, 10))}
                    </Text>
                    <View style={styles.dots}>
                      {(['morning', 'afternoon'] as const).map((period) => (
                        <View
                          key={period}
                          style={[
                            styles.dot,
                            {
                              backgroundColor: booked?.has(period)
                                ? selected
                                  ? Colors.white
                                  : accent
                                : 'transparent',
                            },
                          ]}
                        />
                      ))}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        />
      ) : null}

      {/* ---- Filtre actif ---- */}
      {selectedDay ? (
        <View style={styles.filter}>
          <Text style={styles.filterText} numberOfLines={1}>
            {selectedDay === today ? "Aujourd'hui" : capitalize(formatLongDate(selectedDay, new Date().getFullYear()))}
          </Text>
          <TouchableOpacity
            style={[styles.filterReset, { borderColor: withAlpha(accent, 0.45) }]}
            onPress={() => setSelectedDay(null)}
            hitSlop={6}
          >
            <Text style={[styles.filterResetText, { color: accent }]}>Toutes les séances</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {selectedDay && visibleSections.length === 0 ? (
        <Text style={styles.filterEmpty}>Aucune séance ce jour-là.</Text>
      ) : null}
    </View>
  );

  const empty = isLoading ? (
    <View style={styles.loading}>
      <BouncingDots color={accent} size={10} bounceHeight={5} />
    </View>
  ) : (
    <View style={styles.empty}>
      <View style={[styles.emptyMedallion, { backgroundColor: withAlpha(accent, 0.12) }]}>
        <MaterialCommunityIcons name={isError ? 'wifi-off' : 'calendar-blank-outline'} size={40} color={accent} />
      </View>
      <Text style={styles.emptyTitle}>{isError ? 'Chargement impossible' : 'Aucune séance à venir'}</Text>
      <Text style={styles.emptyText}>
        {isError
          ? 'Vérifiez votre connexion, puis tirez vers le bas pour réessayer.'
          : 'Les rendez-vous que vous acceptez et ceux que vous réservez auprès d’un confrère apparaîtront ici.'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.grayLight} />

      <SectionList
        sections={visibleSections}
        keyExtractor={(item) => String(item.block_id)}
        renderSectionHeader={({ section }) =>
          selectedDay ? null : (
          <Text style={styles.sectionTitle}>
            {section.date === today ? "Aujourd'hui" : capitalize(formatLongDate(section.date, new Date().getFullYear()))}
          </Text>
          )
        }
        renderItem={({ item }) => {
          const color = colorOf(item);
          const mode = MODE_META[item.mode];
          return (
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              onPress={() => openSession(item)}
              accessibilityRole="button"
            >
              <View style={[styles.rowBar, { backgroundColor: color }]} />
              <View style={styles.rowTime}>
                <MaterialCommunityIcons name={PERIOD_ICONS[item.period]} size={18} color={Colors.lblueDark} />
                <Text style={styles.rowHour}>{item.start_local}</Text>
                <Text style={styles.rowHourEnd}>{item.end_local}</Text>
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle} numberOfLines={2}>
                  {item.offer_title}
                </Text>
                <View style={styles.rowMeta}>
                  <MaterialCommunityIcons name={mode.icon} size={14} color={mode.color} />
                  <Text style={styles.rowMetaText} numberOfLines={1}>
                    {placeLabel(item)}
                  </Text>
                  {item.total > 1 ? (
                    <Text style={[styles.rowIndex, { color }]}>
                      {item.index}/{item.total}
                    </Text>
                  ) : null}
                </View>
                <Parties
                  guest={item.role === 'guest'}
                  requesterName={item.requester.name}
                  expert={item.expert}
                  color={color}
                />
              </View>
            </Pressable>
          );
        }}
        stickySectionHeadersEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={header}
        ListEmptyComponent={sessions.length === 0 ? empty : null}
        contentContainerStyle={[styles.list, { paddingBottom: bottomInset + Spacings.md }]}
        scrollIndicatorInsets={{ bottom: bottomInset }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={pulling} onRefresh={pullToRefresh} colors={[accent]} tintColor={accent} />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  /* ---- Structure ---- */
  container: {
    flex: 1,
    backgroundColor: Colors.grayLight,
  },
  list: {
    paddingHorizontal: LIST_PADDING,
  },
  loading: {
    alignItems: 'center',
    paddingVertical: Spacings.xxl,
  },
  separator: {
    height: Spacings.sm,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },

  /* ---- En-tête ---- */
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacings.md,
    paddingTop: Spacings.lg,
    paddingBottom: Spacings.md,
  },
  title: {
    flex: 1,
    fontFamily: 'Poppins-Bold',
    fontSize: 30,
    lineHeight: 38,
    color: Colors.text,
  },
  historyButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ---- Prochaine séance ---- */
  next: {
    padding: Spacings.md,
    borderRadius: 22,
  },
  nextHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacings.sm,
  },
  nextKicker: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  nextWhen: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
  },
  nextTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    lineHeight: 26,
    color: Colors.text,
    marginTop: Spacings.sm,
  },
  nextMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    marginTop: Spacings.xs,
  },
  nextMetaText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.subtext,
  },
  nextJoin: {
    marginTop: Spacings.md,
  },

  /* ---- Bandeau de la semaine ---- */
  stripHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacings.lg,
    marginBottom: Spacings.xs,
  },
  stripArrow: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stripMonth: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: Colors.text,
  },
  strip: {
    flexGrow: 0,
  },
  filter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacings.sm,
    marginTop: Spacings.lg,
    marginBottom: Spacings.sm,
  },
  filterText: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.subtext,
  },
  filterReset: {
    height: 30,
    paddingHorizontal: Spacings.sm,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
  },
  filterResetText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
  },
  filterEmpty: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: Colors.subtext,
    textAlign: 'center',
    paddingVertical: Spacings.lg,
  },
  week: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  day: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacings.xs,
    marginHorizontal: 2,
    borderRadius: 14,
  },
  dayLetter: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    color: Colors.subtext,
  },
  dayNumber: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: Colors.text,
  },
  dayNumberIdle: {
    fontFamily: 'Poppins-Regular',
    color: Colors.subtext,
  },
  dayTextSelected: {
    color: Colors.white,
  },
  dots: {
    flexDirection: 'row',
    gap: 3,
    height: 6,
    marginTop: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  /* ---- Liste ---- */
  sectionTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.subtext,
    marginTop: Spacings.lg,
    marginBottom: Spacings.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacings.md,
    padding: Spacings.md,
    paddingLeft: Spacings.md + 4,
    borderRadius: 16,
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  rowBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  rowTime: {
    width: 52,
    alignItems: 'center',
    gap: 2,
  },
  rowHour: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: Colors.text,
  },
  rowHourEnd: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.subtext,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    lineHeight: 21,
    color: Colors.text,
  },
  rowColumn: {
    flexDirection: 'column',
    gap: 0,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  rowMetaText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.subtext,
  },
  rowIndex: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
  },
  flex: {
    flex: 1,
  },

  /* ---- Demandeur / Expert ---- */
  parties: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacings.sm,
    marginTop: Spacings.sm,
    paddingTop: Spacings.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  party: {
    flexShrink: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.subtext,
  },
  partyName: {
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  // « Moi » ressort : on repère d'un coup d'œil de quel côté on est.
  partyMe: {
    fontFamily: 'Poppins-Bold',
  },
  partyExpert: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
  },

  /* ---- En attente ---- */
  pendingList: {
    gap: Spacings.sm,
  },
  pendingHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.sm,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 24,
    paddingHorizontal: Spacings.xs,
    borderRadius: 999,
  },
  pendingBadgeText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
  },

  /* ---- État vide ---- */
  empty: {
    alignItems: 'center',
    paddingVertical: Spacings.xxl,
    paddingHorizontal: Spacings.lg,
  },
  emptyMedallion: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacings.lg,
  },
  emptyTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: Colors.text,
    marginBottom: Spacings.xs,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: 'Roboto',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.gray,
    textAlign: 'center',
  },
});