import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import { useFloatingTabBarInset } from '../../../component/booking/FloatingTabBar';
import { ExpertRevenueItem, getMyRevenue } from '../../../services/v2/BookingService';
import { BookingScreenHeader } from '../components/BookingScreenHeader';
import { MONTHS } from '../bookingDates';
import { blocksLabel, formatPrice } from '../bookingFormat';
import { CONSULT_COLOR, durationText } from '../bookingKinds';
import { withAlpha } from '../bookingPalette';

/* ---- Web ---- */
const WEB_SIDEBAR_WIDTH = 200;
/** À partir de cette largeur de contenu : résumé et graphique à gauche, liste à droite. */
const WEB_TWO_COLUMNS_FROM = 900;
const WEB_MAX_WIDTH = 1040;
const WEB_SINGLE_MAX_WIDTH = 560;
const WEB_SUMMARY_COLUMN = 400;

const MONTH_INITIALS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const CHART_HEIGHT = 120;

const pad = (n: number) => String(n).padStart(2, '0');
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const plural = (count: number, singular: string, pluralForm: string) => `${count} ${count > 1 ? pluralForm : singular}`;

/** « 12/11 » à partir du jour (ISO) ; le jour du débit est déjà en heure de Paris. */
const dayMonth = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
/** Début de séance, à l'heure de l'appareil. */
const localDayMonth = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
};
const monthOf = (item: ExpertRevenueItem) => Number(item.captured_at.slice(5, 7));

/**
 * Revenus de l'expert (mobile et web) : sa part seulement — HT, commission déduite,
 * après remboursements éventuels —, par année, mois par mois, puis rendez-vous par rendez-vous.
 * Un mois touché dans le graphique filtre la liste ; touché à nouveau, la liste revient à l'année.
 */
export const ExpertiseRevenueView = ({ navigation }) => {
  const bottomInset = useFloatingTabBarInset();
  const { width } = useWindowDimensions();
  const [year, setYear] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);
  const [pulling, setPulling] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['booking', 'me', 'revenue', year ?? 'current'],
    queryFn: () => getMyRevenue(year ?? undefined),
  });

  const pullToRefresh = async () => {
    setPulling(true);
    try {
      await refetch();
    } finally {
      setPulling(false);
    }
  };

  const isWeb = Platform.OS === 'web';
  const wide = isWeb && width - WEB_SIDEBAR_WIDTH >= WEB_TWO_COLUMNS_FROM;

  const shownYear = data?.year ?? year ?? new Date().getFullYear();
  const years = data?.years ?? [shownYear];
  const olderYear = years.find((y) => y < shownYear) ?? null;
  const newerYear = [...years].reverse().find((y) => y > shownYear) ?? null;

  const changeYear = (next: number | null) => {
    if (next == null) return;
    setMonth(null);
    setYear(next);
  };

  const items = useMemo(
    () => (data?.items ?? []).filter((item) => month == null || monthOf(item) === month),
    [data, month]
  );
  const monthData = month != null ? data?.months.find((m) => m.month === month) : null;
  const maxPayout = Math.max(0, ...(data?.months ?? []).map((m) => m.payout));
  const currency = data?.currency ?? 'EUR';

  /* ---- Résumé de l'année et graphique mensuel ---- */
  const summary = (
    <View style={styles.card}>
      <View style={styles.yearRow}>
        <TouchableOpacity
          style={[styles.yearArrow, olderYear == null && styles.disabled]}
          onPress={() => changeYear(olderYear)}
          disabled={olderYear == null}
          hitSlop={8}
          accessibilityLabel="Année précédente"
        >
          <Ionicons name="chevron-back" size={20} color={Colors.lblueDark} />
        </TouchableOpacity>
        <Text style={styles.year}>{shownYear}</Text>
        <TouchableOpacity
          style={[styles.yearArrow, newerYear == null && styles.disabled]}
          onPress={() => changeYear(newerYear)}
          disabled={newerYear == null}
          hitSlop={8}
          accessibilityLabel="Année suivante"
        >
          <Ionicons name="chevron-forward" size={20} color={Colors.lblueDark} />
        </TouchableOpacity>
      </View>

      <Text style={styles.totalLabel}>Votre part en {shownYear}</Text>
      <Text style={styles.total}>{formatPrice(data?.total.payout ?? 0, currency)}</Text>
      <Text style={styles.totalSub}>
        {plural(data?.total.count ?? 0, 'rendez-vous payé', 'rendez-vous payés')}
        {data?.total.refunded_count ? ` · ${data.total.refunded_count} remboursé(s)` : ''}
      </Text>

      {/* Barres des 12 mois : la hauteur suit la part du mois. */}
      <View style={styles.chart}>
        {(data?.months ?? MONTH_INITIALS.map((_, i) => ({ month: i + 1, count: 0, payout: 0 }))).map((m) => {
          const selected = month === m.month;
          const height = maxPayout > 0 ? Math.max(m.payout > 0 ? 4 : 0, (m.payout / maxPayout) * CHART_HEIGHT) : 0;
          return (
            <TouchableOpacity
              key={m.month}
              style={styles.barCol}
              onPress={() => setMonth(selected ? null : m.month)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${capitalize(MONTHS[m.month - 1])} : ${formatPrice(m.payout, currency)}`}
            >
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    { height },
                    month != null && !selected && styles.barDimmed,
                    selected && styles.barSelected,
                  ]}
                />
              </View>
              <Text style={[styles.barLabel, selected && styles.barLabelSelected]}>{MONTH_INITIALS[m.month - 1]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.hint}>
        Montants HT, commission OrthoMaster déduite et remboursements éventuels retirés. Un rendez-vous compte le jour
        où il a été débité, à votre acceptation.
      </Text>
    </View>
  );

  /* ---- Liste des rendez-vous (de l'année, ou du mois choisi) ---- */
  const list = (
    <View style={styles.stack}>
      <View style={styles.listHead}>
        <Text style={styles.sectionTitle}>
          {month != null ? `${MONTHS[month - 1]} ${shownYear}` : `Rendez-vous ${shownYear}`}
        </Text>
        {month != null ? (
          <TouchableOpacity onPress={() => setMonth(null)} hitSlop={8} style={styles.clear}>
            <Text style={styles.clearText}>
              {formatPrice(monthData?.payout ?? 0, currency)} · Toute l'année
            </Text>
            <Ionicons name="close-circle" size={16} color={Colors.lblueDark} />
          </TouchableOpacity>
        ) : null}
      </View>

      {items.length === 0 ? (
        <View style={[styles.card, styles.empty]}>
          <MaterialCommunityIcons name="cash-remove" size={28} color={Colors.subtext} />
          <Text style={styles.emptyText}>
            {month != null ? 'Aucun rendez-vous payé ce mois-ci.' : 'Aucun rendez-vous payé cette année.'}
          </Text>
        </View>
      ) : (
        <View style={[styles.card, styles.listCard]}>
          {items.map((item, index) => (
            <RevenueRow key={item.id} item={item} currency={currency} last={index === items.length - 1} />
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.lblue} />
      <BookingScreenHeader title="Revenus" onBack={() => navigation.goBack()} webLarge />

      <ScrollView
        style={styles.body}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomInset + Spacings.md },
          isWeb && (wide ? styles.webWide : styles.webSingle),
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={pulling} onRefresh={pullToRefresh} colors={[Colors.lblue]} tintColor={Colors.lblue} />
        }
      >
        {isLoading && !data ? (
          <ActivityIndicator style={styles.loader} color={Colors.lblue} />
        ) : wide ? (
          <View style={styles.webColumns}>
            <View style={styles.webSummaryColumn}>{summary}</View>
            <View style={styles.webListColumn}>{list}</View>
          </View>
        ) : (
          <>
            {summary}
            {list}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

/** Une ligne : sujet, demandeur, dates ; à droite la part de l'expert (barrée si un remboursement l'a réduite). */
const RevenueRow = ({ item, currency, last }: { item: ExpertRevenueItem; currency: string; last: boolean }) => {
  const consultation = item.kind === 'consultation';
  const reduced = item.refunded !== 'none';
  const size = consultation
    ? item.duration_minutes
      ? durationText(item.duration_minutes)
      : null
    : item.blocks_count
      ? blocksLabel(item.blocks_count)
      : null;

  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <View style={[styles.kindDot, { backgroundColor: consultation ? CONSULT_COLOR : Colors.lblue }]} />
      <View style={styles.rowTexts}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.rowSub} numberOfLines={1}>
          {item.requester}
          {size ? ` · ${size}` : ''}
          {` · ${item.mode === 'onsite' ? 'présentiel' : 'visio'}`}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          Débité le {dayMonth(item.captured_at)}
          {item.first_start ? ` · séance le ${localDayMonth(item.first_start)}` : ''}
          {` · ${item.reference}`}
        </Text>
        {item.cancelled || reduced ? (
          <View style={styles.tags}>
            {item.cancelled ? <Text style={[styles.tag, styles.tagMuted]}>Annulé</Text> : null}
            {reduced ? (
              <Text style={[styles.tag, styles.tagWarning]}>
                {item.refunded === 'full' ? 'Remboursé au demandeur' : 'Remboursé en partie'}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
      <View style={styles.amounts}>
        <Text style={styles.amount}>{formatPrice(item.payout, currency)}</Text>
        {reduced ? <Text style={styles.amountGross}>{formatPrice(item.payout_gross, currency)}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lblue,
  },
  body: {
    flex: 1,
    backgroundColor: Colors.grayLight,
  },
  content: {
    padding: Spacings.md,
    gap: Spacings.md,
  },
  stack: {
    gap: Spacings.sm,
  },
  loader: {
    marginTop: Spacings.xl,
  },

  /* ---- Web ---- */
  webSingle: {
    width: '100%',
    maxWidth: WEB_SINGLE_MAX_WIDTH,
    alignSelf: 'center',
    paddingTop: Spacings.lg,
  },
  webWide: {
    width: '100%',
    maxWidth: WEB_MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.lg,
  },
  webColumns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.xl,
  },
  // Reste visible pendant le défilement de la liste.
  webSummaryColumn: {
    width: WEB_SUMMARY_COLUMN,
    position: 'sticky' as any,
    top: Spacings.md,
  },
  webListColumn: {
    flex: 1,
    minWidth: 0,
  },

  card: {
    padding: Spacings.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },

  /* ---- Résumé ---- */
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.md,
    marginBottom: Spacings.sm,
  },
  yearArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.lblue3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.35,
  },
  year: {
    minWidth: 64,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: Colors.text,
  },
  totalLabel: {
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.subtext2,
  },
  total: {
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
    fontSize: 32,
    lineHeight: 42,
    color: Colors.text,
  },
  totalSub: {
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.subtext2,
  },

  /* ---- Graphique ---- */
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginTop: Spacings.md,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barTrack: {
    width: '100%',
    height: CHART_HEIGHT,
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#F4F6F9',
  },
  bar: {
    width: '100%',
    borderRadius: 6,
    backgroundColor: Colors.lblue,
  },
  barDimmed: {
    backgroundColor: withAlpha(Colors.lblue, 0.35),
  },
  barSelected: {
    backgroundColor: Colors.lblueDark,
  },
  barLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    color: Colors.subtext,
  },
  barLabelSelected: {
    color: Colors.lblueDark,
  },
  hint: {
    marginTop: Spacings.md,
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    lineHeight: 17,
    color: Colors.subtext,
  },

  /* ---- Liste ---- */
  listHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacings.sm,
    marginTop: Spacings.xs,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.subtext,
    marginLeft: Spacings.xxs,
  },
  clear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: Colors.lblueDark,
  },
  empty: {
    alignItems: 'center',
    gap: Spacings.xs,
    paddingVertical: Spacings.lg,
  },
  emptyText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: Colors.subtext2,
    textAlign: 'center',
  },
  listCard: {
    paddingVertical: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.sm,
    paddingVertical: Spacings.md,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  kindDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 7,
  },
  rowTexts: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  rowTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: Colors.text,
  },
  rowSub: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.subtext2,
  },
  rowMeta: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.subtext,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
  },
  tagMuted: {
    color: Colors.subtext2,
    backgroundColor: '#F1F3F6',
  },
  tagWarning: {
    color: Colors.yellowDark,
    backgroundColor: Colors.warningBackground,
  },
  amounts: {
    alignItems: 'flex-end',
  },
  amount: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: Colors.text,
  },
  amountGross: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.subtext,
    textDecorationLine: 'line-through',
  },
});
