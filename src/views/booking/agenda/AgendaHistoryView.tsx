import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  StatusBar,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import { BouncingDots } from '../../../component/LoadingDots';
import { useFloatingTabBarInset } from '../../../component/booking/FloatingTabBar';
import { ExpertRequest, getExpertAgendaHistory } from '../../../services/v2/BookingService';
import { accentOf, withAlpha } from '../bookingPalette';
import { useBookingSetup } from '../useBookingSetup';
import { REQUESTS_ACCENT } from '../requests/requestFormat';
import { RequestCard } from '../requests/components/RequestCard';

const LIST_PADDING = Spacings.lg;

const IS_WEB = Platform.OS === 'web';
/** Web : barre latérale commune (AppTab.web) ; la zone de contenu est le reste. */
const WEB_SIDEBAR_WIDTH = 200;
const WEB_TWO_COLUMNS_FROM = 900;
const WEB_MAX_WIDTH = 1180;
const WEB_SINGLE_MAX_WIDTH = 640;
const WEB_GAP = Spacings.md;

export const EXPERT_AGENDA_HISTORY_KEY = ['booking', 'expert-agenda', 'history'];

/**
 * Rendez-vous acceptés et terminés, le plus récent d'abord.
 * Paginé, le plus récent d'abord ; la page suivante se charge à l'approche de la fin.
 *
 * Web : contenu centré (même largeur que l'Agenda), cartes sur deux colonnes sur grand écran,
 * une seule colonne centrée sur écran étroit.
 */
export const AgendaHistoryView = ({ navigation }) => {
  const bottomInset = useFloatingTabBarInset();
  const { width } = useWindowDimensions();
  const twoColumns = IS_WEB && width - WEB_SIDEBAR_WIDTH >= WEB_TWO_COLUMNS_FROM;
  const columns = twoColumns ? 2 : 1;
  const { setup } = useBookingSetup();
  const accent = accentOf(setup?.expert?.palette_color);

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: EXPERT_AGENDA_HISTORY_KEY,
      initialPageParam: 1,
      queryFn: async ({ pageParam }) => {
        const page = await getExpertAgendaHistory(pageParam);
        if (!page) throw new Error('history');
        return page;
      },
      getNextPageParam: (last) => (last.pagination.has_more ? last.pagination.page + 1 : undefined),
    });

  const bookings = data?.pages.flatMap((page) => page.requests) ?? [];

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

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  const openRequest = (request: ExpertRequest) =>
    navigation.navigate('request-detail', { bookingId: request.id, preview: request });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.grayLight} />

      <View style={[styles.head, IS_WEB && styles.webCentered, IS_WEB && (twoColumns ? styles.webWide : styles.webNarrow)]}>
        <TouchableOpacity
          style={styles.round}
          onPress={() => navigation.goBack()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <Ionicons name="chevron-back" size={22} color={REQUESTS_ACCENT} />
        </TouchableOpacity>
        <Text style={styles.title}>Rendez-vous passés</Text>
      </View>

      <FlatList
        // Changer le nombre de colonnes impose une nouvelle liste.
        key={`columns-${columns}`}
        data={bookings}
        numColumns={columns}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) =>
          twoColumns ? (
            // Une carte seule sur la dernière ligne garde la largeur d'une colonne.
            <View style={styles.webCell}>
              <RequestCard request={item} accent={accent} onPress={() => openRequest(item)} />
            </View>
          ) : (
            <RequestCard request={item} accent={accent} onPress={() => openRequest(item)} />
          )
        }
        columnWrapperStyle={twoColumns ? styles.webRow : undefined}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={[
          styles.list,
          IS_WEB && styles.webCentered,
          IS_WEB && (twoColumns ? styles.webWide : styles.webNarrow),
          { paddingBottom: bottomInset + Spacings.md },
        ]}
        scrollIndicatorInsets={{ bottom: bottomInset }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={pulling}
            onRefresh={pullToRefresh}
            colors={[REQUESTS_ACCENT]}
            tintColor={REQUESTS_ACCENT}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loading}>
              <BouncingDots color={REQUESTS_ACCENT} size={10} bounceHeight={5} />
            </View>
          ) : (
            <View style={styles.empty}>
              <View style={styles.emptyMedallion}>
                <MaterialCommunityIcons
                  name={isError ? 'wifi-off' : 'history'}
                  size={40}
                  color={REQUESTS_ACCENT}
                />
              </View>
              <Text style={styles.emptyTitle}>{isError ? 'Chargement impossible' : 'Aucun rendez-vous passé'}</Text>
              <Text style={styles.emptyText}>
                {isError
                  ? 'Vérifiez votre connexion, puis tirez vers le bas pour réessayer.'
                  : 'Vos rendez-vous terminés apparaîtront ici. Vous pouvez y signaler une absence jusqu’à 24 h après la dernière demi-journée.'}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator color={REQUESTS_ACCENT} />
            </View>
          ) : null
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
    paddingTop: Spacings.md,
  },
  loading: {
    alignItems: 'center',
    paddingVertical: Spacings.xxl,
  },
  separator: {
    height: Spacings.md,
  },
  footer: {
    paddingVertical: Spacings.md,
  },

  /* ---- Web ---- */
  webCentered: {
    width: '100%',
    alignSelf: 'center',
  },
  // Largeur maximale + marges de la liste (paddingHorizontal).
  webWide: {
    maxWidth: WEB_MAX_WIDTH + LIST_PADDING * 2,
  },
  webNarrow: {
    maxWidth: WEB_SINGLE_MAX_WIDTH + LIST_PADDING * 2,
  },
  webRow: {
    gap: WEB_GAP,
  },
  webCell: {
    flex: 1,
    maxWidth: `calc(50% - ${WEB_GAP / 2}px)` as any,
  },

  /* ---- En-tête ---- */
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    paddingHorizontal: LIST_PADDING,
    paddingTop: Spacings.md,
  },
  round: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: withAlpha(REQUESTS_ACCENT, 0.45),
    backgroundColor: withAlpha(REQUESTS_ACCENT, 0.1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: 'Poppins-Bold',
    fontSize: 26,
    color: Colors.text,
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
    backgroundColor: withAlpha(REQUESTS_ACCENT, 0.12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacings.lg,
  },
  emptyTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: Colors.text,
    marginBottom: Spacings.xs,
  },
  emptyText: {
    fontFamily: 'Roboto',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.gray,
    textAlign: 'center',
  },
});