import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import { BouncingDots } from '../../../component/LoadingDots';
import { useFloatingTabBarInset } from '../../../component/booking/FloatingTabBar';
import { BookingExpertListItem, getBookingExperts } from '../../../services/v2/BookingService';
import { ExpertCard } from './components/ExpertCard';

/** Même valeur que BookingExpertController::PER_PAGE : sert au rang d'entrée en cascade. */
const PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 350;

/** Marge latérale de l'écran. */
const LIST_PADDING = Spacings.lg;

/**
 * Experts, 10 par page, ceux qui acceptent des demandes en tête.
 * La page suivante se charge à l'approche de la fin ; la marge basse tient compte de la
 * barre flottante, sinon la dernière carte et l'indicateur passeraient dessous.
 */
export const ExpertsListView = ({ navigation }) => {
  const bottomInset = useFloatingTabBarInset();
  // Largeur de fenêtre plutôt que onLayout : fiable dès le premier rendu.
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth - LIST_PADDING * 2;
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  // La recherche part au serveur (la liste est paginée) : on attend la fin de la frappe.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['booking', 'experts', query],
    queryFn: async ({ pageParam }) => {
      const page = await getBookingExperts({ page: pageParam, q: query || undefined });
      // Une page en échec doit passer en erreur, pas se lire comme une liste vide.
      if (!page) throw new Error('experts');
      return page;
    },
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pagination.has_more ? last.pagination.page + 1 : undefined),
  });

  // Indicateur réservé au tirage manuel : un rechargement en arrière-plan ne fait pas sauter la liste.
  const [pulling, setPulling] = useState(false);
  const pullToRefresh = async () => {
    setPulling(true);
    try {
      await refetch();
    } finally {
      setPulling(false);
    }
  };

  const experts = useMemo(() => data?.pages.flatMap((page) => page.experts) ?? [], [data]);

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  const renderExpert = ({ item, index }: { item: BookingExpertListItem; index: number }) => (
    <ExpertCard
      expert={item}
      width={cardWidth}
      indexInPage={index % PER_PAGE}
      // L'aperçu affiche l'en-tête du profil tout de suite, sans attendre la requête.
      onPress={() => navigation.navigate('expert-profile', { expertId: item.id, preview: item })}
    />
  );

  const emptyState = () => {
    const kind = isError ? 'error' : query ? 'search' : 'none';
    const content = {
      error: { icon: 'wifi-off', title: 'Erreur de chargement', text: 'Tirez vers le bas pour réessayer.' },
      search: { icon: 'account-search-outline', title: 'Aucun résultat', text: 'Essayez un autre nom ou un autre domaine.' },
      none: { icon: 'account-clock-outline', title: 'Aucun expert', text: 'Les experts arrivent bientôt.' },
    }[kind];

    return (
      <View style={styles.empty}>
        <View style={styles.emptyMedallion}>
          <MaterialCommunityIcons name={content.icon as any} size={40} color={Colors.lblueDark} />
        </View>
        <Text style={styles.emptyTitle}>{content.title}</Text>
        <Text style={styles.emptyText}>{content.text}</Text>
      </View>
    );
  };

  // En-tête d'écran d'accueil : titre et recherche défilent avec la liste.
  // Passé en élément (pas en composant) : le champ garde le focus pendant la frappe.
  const listHeader = (
    <View style={styles.head}>
      <Text style={styles.title}>Trouvez l'expert qui vous correspond</Text>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={Colors.subtext} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher un expert ou un domaine"
          placeholderTextColor={Colors.subtext}
          returnKeyType="search"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={8} accessibilityLabel="Effacer la recherche">
            <Ionicons name="close-circle" size={18} color={Colors.subtext} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.grayLight} />

      <FlatList
        data={experts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderExpert}
        contentContainerStyle={[styles.list, { paddingBottom: bottomInset + Spacings.md }]}
        // L'indicateur de défilement s'arrête au-dessus de la barre flottante.
        scrollIndicatorInsets={{ bottom: bottomInset }}
        onEndReached={loadMore}
        // Déclenché environ une demi-hauteur d'écran avant la fin : la suite arrive avant d'y être.
        onEndReachedThreshold={0.5}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={pulling} onRefresh={pullToRefresh} colors={[Colors.lblue]} tintColor={Colors.lblue} />
        }
        ListHeaderComponent={listHeader}
        // Premier chargement sous l'en-tête : le titre reste en place, seule la grille attend.
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loading}>
              <BouncingDots color={Colors.lblue} size={10} bounceHeight={5} />
            </View>
          ) : (
            emptyState
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator color={Colors.lblue} />
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
  loading: {
    alignItems: 'center',
    paddingVertical: Spacings.xxl,
  },
  list: {
    paddingHorizontal: LIST_PADDING,
    gap: Spacings.lg,
  },
  footer: {
    paddingVertical: Spacings.md,
  },

  /* ---- En-tête ---- */
  head: {
    paddingTop: Spacings.lg,
    paddingBottom: Spacings.md,
  },
  // Limité à 90 % de la largeur : le titre ne colle pas au bord droit.
  title: {
    maxWidth: '90%',
    fontFamily: 'Poppins-Bold',
    fontSize: 30,
    lineHeight: 38,
    color: Colors.text,
  },

  /* ---- Recherche ---- */
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    height: 48,
    marginTop: Spacings.md,
    paddingHorizontal: Spacings.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Roboto',
    fontSize: 15,
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
    backgroundColor: Colors.lblue3,
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