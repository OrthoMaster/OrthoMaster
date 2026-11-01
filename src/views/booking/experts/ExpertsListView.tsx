import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ScrollView,
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
import { BookingExpertListItem, getBookingExperts } from '../../../services/v2/BookingService';
import { ExpertCard } from './components/ExpertCard';

/** Même valeur que BookingExpertController::PER_PAGE : sert au rang d'entrée en cascade. */
const PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 350;

/** Marge latérale de l'écran. */
const LIST_PADDING = Spacings.lg;

const IS_WEB = Platform.OS === 'web';
/** Web : barre latérale commune (AppTab.web) ; la zone de contenu est le reste. */
const WEB_SIDEBAR_WIDTH = 200;
const WEB_TWO_COLUMNS_FROM = 900;
const WEB_MAX_WIDTH = 1180;
const WEB_SINGLE_MAX_WIDTH = 640;
const WEB_GAP = Spacings.lg;
/** Web : recherche à droite du titre, largeur bornée ; saisie limitée. */
const WEB_SEARCH_WIDTH = 380;
const WEB_SEARCH_MAX_LENGTH = 100;

/**
 * Experts, 10 par page, ceux qui acceptent des demandes en tête.
 * La page suivante se charge à l'approche de la fin ; la marge basse tient compte de la
 * barre flottante, sinon la dernière carte et l'indicateur passeraient dessous.
 *
 * Web : contenu centré, cartes sur deux colonnes sur grand écran (une colonne sur écran
 * étroit), thèmes proposés dépliés d'office.
 */
export const ExpertsListView = ({ navigation }) => {
  const bottomInset = useFloatingTabBarInset();
  // Largeur de fenêtre plutôt que onLayout : fiable dès le premier rendu.
  const { width: screenWidth } = useWindowDimensions();
  // Web : la largeur de la fenêtre comprend la barre latérale ; le contenu est borné et centré.
  const contentWidth = IS_WEB ? screenWidth - WEB_SIDEBAR_WIDTH : screenWidth;
  const twoColumns = IS_WEB && contentWidth >= WEB_TWO_COLUMNS_FROM;
  const innerWidth = IS_WEB
    ? Math.min(contentWidth - LIST_PADDING * 2, twoColumns ? WEB_MAX_WIDTH : WEB_SINGLE_MAX_WIDTH)
    : screenWidth - LIST_PADDING * 2;
  const cardWidth = twoColumns ? (innerWidth - WEB_GAP) / 2 : innerWidth;
  const [search, setSearch] = useState('');
  // Web : le contour du navigateur est retiré du champ, le cadre de la recherche le remplace.
  const [searchFocused, setSearchFocused] = useState(false);
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
      defaultOpen={IS_WEB}
      // L'aperçu affiche l'en-tête du profil tout de suite, sans attendre la requête.
      onPress={() => navigation.navigate('expert-profile', { expertId: item.id, preview: item })}
      // Toucher un thème : le profil s'ouvre puis fait défiler les thèmes jusqu'à celui-ci.
      onOfferPress={(offerId) =>
        navigation.navigate('expert-profile', { expertId: item.id, preview: item, focusOfferId: offerId })
      }
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
    // Web, grand écran : comme l'Agenda, titre à gauche et recherche à droite sur une ligne.
    <View
      style={[
        styles.head,
        IS_WEB && { width: innerWidth, alignSelf: 'center' },
        twoColumns && styles.headWeb,
      ]}
    >
      <Text style={[styles.title, twoColumns && styles.titleWeb]}>Trouvez l'expert qui vous correspond</Text>

      <View style={[styles.searchWrap, twoColumns && styles.searchWrapWeb, IS_WEB && searchFocused && styles.searchWrapFocused]}>
        <Ionicons name="search" size={18} color={Colors.subtext} />
        <TextInput
          style={[styles.searchInput, IS_WEB && styles.searchInputWeb]}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher un expert ou un domaine"
          placeholderTextColor={Colors.subtext}
          returnKeyType="search"
          autoCorrect={false}
          maxLength={IS_WEB ? WEB_SEARCH_MAX_LENGTH : undefined}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={8} accessibilityLabel="Effacer la recherche">
            <Ionicons name="close-circle" size={18} color={Colors.subtext} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const listEmpty = isLoading ? (
    <View style={styles.loading}>
      <BouncingDots color={Colors.lblue} size={10} bounceHeight={5} />
    </View>
  ) : (
    emptyState()
  );

  const listFooter = isFetchingNextPage ? (
    <View style={styles.footer}>
      <ActivityIndicator color={Colors.lblue} />
    </View>
  ) : null;

  /* ---- Web, grand écran : deux colonnes indépendantes (hauteurs de cartes différentes) ---- */
  if (twoColumns) {
    // Chaque carte va dans la colonne la moins remplie, d'après une hauteur estimée
    // (en-tête + une ligne par thème déplié) : les colonnes restent équilibrées.
    const estimate = (expert: BookingExpertListItem) =>
      140 + (expert.online && expert.offers?.length ? 40 + expert.offers.length * 56 : 0);
    const gridColumns: { expert: BookingExpertListItem; index: number }[][] = [[], []];
    const heights = [0, 0];
    experts.forEach((expert, index) => {
      const target = heights[0] <= heights[1] ? 0 : 1;
      gridColumns[target].push({ expert, index });
      heights[target] += estimate(expert) + WEB_GAP;
    });

    // Pas de FlatList ici : la page suivante se charge quand le bas approche.
    const onScroll = (e: any) => {
      const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
      if (layoutMeasurement.height + contentOffset.y >= contentSize.height - layoutMeasurement.height / 2) loadMore();
    };

    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={[styles.list, styles.listWeb, { paddingBottom: bottomInset + Spacings.md }]}
          onScroll={onScroll}
          scrollEventThrottle={200}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {listHeader}
          {experts.length === 0 ? (
            listEmpty
          ) : (
            <View style={[styles.webGrid, { width: innerWidth }]}>
              {gridColumns.map((column, c) => (
                <View key={c} style={styles.webColumn}>
                  {column.map(({ expert, index }) => (
                    <View key={expert.id}>{renderExpert({ item: expert, index })}</View>
                  ))}
                </View>
              ))}
            </View>
          )}
          {listFooter}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.grayLight} />

      <FlatList
        data={experts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderExpert}
        contentContainerStyle={[styles.list, IS_WEB && styles.listWeb, { paddingBottom: bottomInset + Spacings.md }]}
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
  // Web : cartes centrées dans la zone de contenu.
  listWeb: {
    alignItems: 'center',
  },
  webGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: WEB_GAP,
  },
  webColumn: {
    flex: 1,
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

  headWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacings.lg,
  },
  titleWeb: {
    flex: 1,
    maxWidth: undefined,
  },
  searchWrapWeb: {
    width: WEB_SEARCH_WIDTH,
    marginTop: 0,
  },
  searchWrapFocused: {
    borderColor: Colors.lblue,
  },
  searchInputWeb: {
    outlineStyle: 'none',
  } as any,

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