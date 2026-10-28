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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import { BouncingDots } from '../../../component/LoadingDots';
import { useFloatingTabBarInset } from '../../../component/booking/FloatingTabBar';
import { ExpertRequest, getExpertRequestHistory } from '../../../services/v2/BookingService';
import { accentOf, withAlpha } from '../bookingPalette';
import { useBookingSetup } from '../useBookingSetup';
import { REQUESTS_ACCENT } from './requestFormat';
import { RequestCard } from './components/RequestCard';

const LIST_PADDING = Spacings.lg;

export const EXPERT_REQUEST_HISTORY_KEY = ['booking', 'expert-requests', 'history'];

/**
 * Historique des demandes reçues : acceptées, refusées, expirées, retirées par le demandeur.
 * Paginé, le plus récent d'abord ; la page suivante se charge à l'approche de la fin.
 */
export const RequestsHistoryView = ({ navigation }) => {
  const bottomInset = useFloatingTabBarInset();
  const { setup } = useBookingSetup();
  const accent = accentOf(setup?.expert?.palette_color);

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: EXPERT_REQUEST_HISTORY_KEY,
      initialPageParam: 1,
      queryFn: async ({ pageParam }) => {
        const page = await getExpertRequestHistory(pageParam);
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

      <View style={styles.head}>
        <TouchableOpacity
          style={styles.round}
          onPress={() => navigation.goBack()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <Ionicons name="chevron-back" size={22} color={REQUESTS_ACCENT} />
        </TouchableOpacity>
        <Text style={styles.title}>Historique</Text>
      </View>

      <FlatList
        data={bookings}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <RequestCard request={item} accent={accent} onPress={() => openRequest(item)} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={[styles.list, { paddingBottom: bottomInset + Spacings.md }]}
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
              <Text style={styles.emptyTitle}>{isError ? 'Chargement impossible' : 'Aucun historique'}</Text>
              <Text style={styles.emptyText}>
                {isError
                  ? 'Vérifiez votre connexion, puis tirez vers le bas pour réessayer.'
                  : 'Les demandes acceptées, refusées, expirées ou retirées apparaîtront ici.'}
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