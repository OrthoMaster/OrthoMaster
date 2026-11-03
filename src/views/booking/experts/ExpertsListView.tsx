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
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import { BouncingDots } from '../../../component/LoadingDots';
import { useFloatingTabBarInset } from '../../../component/booking/FloatingTabBar';
import {
  BookingExpertListItem,
  BookingTheme,
  getBookingExpert,
  getBookingExperts,
  getBookingThemes,
  smartSearchExperts,
  smartSearchThemes,
  startConversationWithExpert,
} from '../../../services/v2/BookingService';
import { notify } from '../bookingActions';
import { CONSULT_COLOR } from '../bookingKinds';
import { withAlpha } from '../bookingPalette';
import { openConversation } from '../messages/openConversation';
import { ExpertCard } from './components/ExpertCard';
import { ConsultationExpertCard } from './components/ConsultationExpertCard';
import { ThemeCard } from './components/ThemeCard';

/** Même valeur que BookingExpertController::PER_PAGE : sert au rang d'entrée en cascade. */
const PER_PAGE = 10;
/** Recherche intelligente (Gemini) : on attend un peu plus la fin de la frappe. */
const SEARCH_DEBOUNCE_MS = 700;
const SMART_MIN_LENGTH = 2;

type Segment = 'experts' | 'themes';

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
 * Thèmes (v3) : deux listes au choix, « Experts » (comme avant) et « Thèmes » (le thème d'abord,
 * l'expert en second). La recherche est intelligente (un tour, Gemini) : chaque résultat dit
 * pourquoi il correspond.
 * Consultation (route.params.purpose = 'consultation') : seulement les experts qui la proposent ;
 * toucher un expert ouvre la demande de consultation.
 *
 * Experts, 10 par page, ceux qui acceptent des demandes en tête.
 * La page suivante se charge à l'approche de la fin ; la marge basse tient compte de la
 * barre flottante, sinon la dernière carte et l'indicateur passeraient dessous.
 *
 * Web : contenu centré, cartes sur deux colonnes sur grand écran (une colonne sur écran
 * étroit), thèmes proposés dépliés d'office.
 */
export const ExpertsListView = ({ navigation, route }) => {
  const consultationMode = route?.params?.purpose === 'consultation';
  const [segment, setSegment] = useState<Segment>(consultationMode ? 'experts' : route?.params?.segment ?? 'experts');
  const showThemes = segment === 'themes' && !consultationMode;
  const queryClient = useQueryClient();
  const [openingThemeId, setOpeningThemeId] = useState<number | null>(null);
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

  // Consultation : filtres Nom et Ville, combinables avec la recherche par domaine / besoin (IA).
  const [nameFilter, setNameFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [nameQuery, setNameQuery] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // La recherche part au serveur : on attend la fin de la frappe.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setNameQuery(nameFilter.trim());
      setCityQuery(cityFilter.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search, nameFilter, cityFilter]);
  const filters = consultationMode
    ? { name: nameQuery || undefined, city: cityQuery || undefined }
    : {};

  // Recherche intelligente à partir de 2 caractères ; sinon, les listes paginées.
  const smart = query.length >= SMART_MIN_LENGTH;

  const expertsQuery = useInfiniteQuery({
    queryKey: ['booking', 'experts', consultationMode ? 'consultation' : 'all', nameQuery, cityQuery],
    queryFn: async ({ pageParam }) => {
      const page = await getBookingExperts({
        page: pageParam,
        consultation: consultationMode ? 1 : undefined,
        ...filters,
      });
      // Une page en échec doit passer en erreur, pas se lire comme une liste vide.
      if (!page) throw new Error('experts');
      return page;
    },
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pagination.has_more ? last.pagination.page + 1 : undefined),
    enabled: !showThemes && !smart,
  });

  const themesQuery = useInfiniteQuery({
    queryKey: ['booking', 'themes'],
    queryFn: async ({ pageParam }) => {
      const page = await getBookingThemes({ page: pageParam });
      if (!page) throw new Error('themes');
      return page;
    },
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pagination.has_more ? last.pagination.page + 1 : undefined),
    enabled: showThemes && !smart,
  });

  const smartQuery = useQuery({
    queryKey: [
      'booking',
      'smart-search',
      showThemes ? 'themes' : consultationMode ? 'consultation' : 'experts',
      query,
      nameQuery,
      cityQuery,
    ],
    queryFn: async () => {
      const result = showThemes
        ? await smartSearchThemes(query)
        : await smartSearchExperts(query, consultationMode ? { consultation: 1, ...filters } : undefined);
      if (!result) throw new Error('search');
      return result;
    },
    enabled: smart,
    staleTime: 5 * 60 * 1000,
  });

  const active = smart ? null : showThemes ? themesQuery : expertsQuery;
  const isLoading = smart ? smartQuery.isLoading : active!.isLoading;
  const isError = smart ? smartQuery.isError : active!.isError;
  const refetch = () => (smart ? smartQuery.refetch() : active!.refetch());
  const fetchNextPage = () => active?.fetchNextPage();
  const hasNextPage = !smart && !!active?.hasNextPage;
  const isFetchingNextPage = !smart && !!active?.isFetchingNextPage;

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

  const experts = useMemo(() => {
    const list: BookingExpertListItem[] = smart
      ? ((smartQuery.data?.results as BookingExpertListItem[]) ?? [])
      : expertsQuery.data?.pages.flatMap((page) => page.experts) ?? [];
    // Consultation : seulement les experts qui la proposent.
    return consultationMode ? list.filter((e) => !!e.consultation) : list;
  }, [smart, smartQuery.data, expertsQuery.data, consultationMode]);

  const themes = useMemo(
    () =>
      smart
        ? ((smartQuery.data?.results as BookingTheme[]) ?? [])
        : themesQuery.data?.pages.flatMap((page) => page.themes) ?? [],
    [smart, smartQuery.data, themesQuery.data]
  );

  // Thème touché : la fiche de l'expert (offres complètes, lieux) est chargée puis le thème s'ouvre.
  const openTheme = async (theme: BookingTheme) => {
    if (openingThemeId) return;
    setOpeningThemeId(theme.id);
    try {
      const detail = await queryClient.fetchQuery({
        queryKey: ['booking', 'expert', theme.expert.id],
        queryFn: () => getBookingExpert(theme.expert.id),
      });
      const offer = detail?.offers.find((o) => o.id === theme.id);
      if (!detail || !offer) {
        notify('Thème indisponible', "Ce thème n'est plus proposé. Tirez la liste pour la rafraîchir.");
        return;
      }
      navigation.navigate('expert-offer', {
        expertId: theme.expert.id,
        offer,
        expert: {
          name: detail.expert.name,
          honorific: detail.expert.honorific,
          avatar_url: detail.expert.avatar_url,
          palette: detail.expert.palette,
          palette_color: detail.expert.palette_color,
        },
      });
    } finally {
      setOpeningThemeId(null);
    }
  };

  const changeSegment = (next: Segment) => {
    if (next === segment) return;
    setSegment(next);
  };

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  // Consultation : « écrire » ouvre (ou reprend) le fil avec l'expert, saisie pré-remplie.
  const [messagingId, setMessagingId] = useState<number | null>(null);
  const messageExpert = async (expert: BookingExpertListItem) => {
    if (messagingId) return;
    setMessagingId(expert.id);
    const result = await startConversationWithExpert(expert.id);
    setMessagingId(null);
    if (result.ok === false) {
      notify('Conversation indisponible', result.message ?? 'Vérifiez votre connexion puis réessayez.');
      return;
    }
    openConversation(navigation, result.data, 'Bonjour, je souhaiterais vous consulter au sujet de ');
  };

  const renderExpert = ({ item, index }: { item: BookingExpertListItem; index: number }) =>
    consultationMode ? (
      <ConsultationExpertCard
        expert={item}
        width={cardWidth}
        indexInPage={index % PER_PAGE}
        onPress={() => navigation.navigate('expert-profile', { expertId: item.id, preview: item })}
        onMessage={() => messageExpert(item)}
        onBook={() => navigation.navigate('consultation-request', { expertId: item.id, preview: item })}
        messaging={messagingId === item.id}
      />
    ) : (
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

  const renderTheme = ({ item, index }: { item: BookingTheme; index: number }) => (
    <ThemeCard
      theme={item}
      width={cardWidth}
      indexInPage={index % PER_PAGE}
      opening={openingThemeId === item.id}
      onPress={() => openTheme(item)}
    />
  );

  const emptyState = () => {
    const kind = isError ? 'error' : smart ? 'search' : 'none';
    const content = {
      error: { icon: 'wifi-off', title: 'Erreur de chargement', text: 'Tirez vers le bas pour réessayer.' },
      search: {
        icon: showThemes ? 'text-search' : 'account-search-outline',
        title: 'Aucun résultat',
        text: 'Décrivez autrement votre besoin, ou essayez un nom ou un domaine.',
      },
      none: showThemes
        ? { icon: 'lightbulb-on-outline', title: 'Aucun thème', text: 'Les thèmes arrivent bientôt.' }
        : consultationMode
          ? { icon: 'chat-question-outline', title: 'Aucun expert', text: "Aucun expert ne propose encore de consultation." }
          : { icon: 'account-clock-outline', title: 'Aucun expert', text: 'Les experts arrivent bientôt.' },
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
  const accent = consultationMode ? CONSULT_COLOR : Colors.lblueDark;

  // Champ de filtre (Consultation) ; flex : part de la largeur sur sa ligne.
  const filterField = (
    key: string,
    icon: keyof typeof Ionicons.glyphMap,
    value: string,
    onChange: (text: string) => void,
    placeholder: string,
    flex?: number
  ) => (
    <View
      style={[
        styles.searchWrap,
        styles.filterWrap,
        flex ? { flex } : null,
        IS_WEB && focusedField === key && { borderColor: CONSULT_COLOR },
      ]}
    >
      <Ionicons name={icon} size={17} color={key === 'domain' ? CONSULT_COLOR : Colors.subtext} />
      <TextInput
        style={[styles.searchInput, IS_WEB && styles.searchInputWeb]}
        onFocus={() => setFocusedField(key)}
        onBlur={() => setFocusedField((f) => (f === key ? null : f))}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.subtext}
        returnKeyType="search"
        autoCorrect={false}
        maxLength={WEB_SEARCH_MAX_LENGTH}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChange('')} hitSlop={8} accessibilityLabel="Effacer">
          <Ionicons name="close-circle" size={18} color={Colors.subtext} />
        </TouchableOpacity>
      )}
    </View>
  );
  const listHeader = (
    // Web, grand écran : comme l'Agenda, titre à gauche et recherche à droite sur une ligne.
    <View
      style={[
        styles.head,
        IS_WEB && { width: innerWidth, alignSelf: 'center' },
        twoColumns && !consultationMode && styles.headWeb,
      ]}
    >
      <View style={[styles.titleBlock, twoColumns && !consultationMode && styles.titleWeb]}>
        {/* Bouton rond (même gabarit que la fermeture du profil) et parcours en cours. */}
        <View style={styles.backRow}>
          {navigation.canGoBack() ? (
            <TouchableOpacity
              style={[styles.back, { borderColor: withAlpha(accent, 0.45), backgroundColor: withAlpha(accent, 0.1) }]}
              onPress={() => navigation.goBack()}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Retour"
            >
              <Ionicons name="chevron-back" size={24} color={accent} style={styles.backIcon} />
            </TouchableOpacity>
          ) : null}
          <Text style={[styles.backText, { color: accent }]}>{consultationMode ? 'Consultation' : 'Thèmes'}</Text>
        </View>
        <Text style={[styles.title, twoColumns && styles.titleInline]}>
          {consultationMode
            ? 'Choisissez votre expert'
            : showThemes
              ? 'Trouvez le thème qui vous correspond'
              : "Trouvez l'expert qui vous correspond"}
        </Text>

        {/* Experts | Thèmes */}
        {!consultationMode ? (
          <View style={styles.segment} accessibilityRole="tablist">
            {(['experts', 'themes'] as Segment[]).map((key) => {
              const on = segment === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.segmentItem, on && styles.segmentItemOn]}
                  onPress={() => changeSegment(key)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                >
                  <Ionicons
                    name={key === 'experts' ? 'people-outline' : 'bulb-outline'}
                    size={16}
                    color={on ? Colors.white : Colors.lblueDark}
                  />
                  <Text style={[styles.segmentText, on && styles.segmentTextOn]}>
                    {key === 'experts' ? 'Experts' : 'Thèmes'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <Text style={styles.consultHint}>
            Échange en visio sur le sujet de votre choix, réservé par tranches de 30 minutes.
          </Text>
        )}
      </View>

      {consultationMode ? (
        // Trois filtres combinables : domaine / besoin (IA), nom, ville.
        <View style={[styles.filters, twoColumns && styles.filtersWeb]}>
          {filterField('domain', 'sparkles-outline', search, setSearch, 'Domaine, besoin…', twoColumns ? 2 : undefined)}
          <View style={[styles.filtersPair, twoColumns && styles.filtersPairWeb]}>
            {filterField('name', 'person-outline', nameFilter, setNameFilter, "Nom de l'expert", 1)}
            {filterField('city', 'location-outline', cityFilter, setCityFilter, 'Ville', 1)}
          </View>
        </View>
      ) : (
      <View style={[styles.searchWrap, twoColumns && styles.searchWrapWeb, IS_WEB && searchFocused && styles.searchWrapFocused]}>
        <Ionicons name="search" size={18} color={Colors.subtext} />
        <TextInput
          style={[styles.searchInput, IS_WEB && styles.searchInputWeb]}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          value={search}
          onChangeText={setSearch}
          placeholder={showThemes ? 'Décrivez votre besoin, un sujet…' : 'Un expert, un domaine, un besoin…'}
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
      )}
    </View>
  );

  // Recherche intelligente : petit rappel sous l'en-tête, avec le nombre de résultats.
  const smartHint = smart ? (
    <View style={[styles.smartHint, IS_WEB && { width: innerWidth, alignSelf: 'center' }]}>
      <Ionicons name="sparkles" size={14} color={accent} />
      <Text style={[styles.smartHintText, { color: accent }]}>
        {smartQuery.isFetching
          ? 'Recherche intelligente en cours…'
          : `Recherche intelligente · ${(showThemes ? themes : experts).length} résultat(s)`}
      </Text>
    </View>
  ) : null;

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
    const estimate = (item: any) =>
      showThemes
        ? (item.image ? cardWidth * 0.42 : 64) + 190 + (item.formats?.length ?? 1) * 26
        : (consultationMode ? 200 : 140) + (!consultationMode && item.online && item.offers?.length ? 40 + item.offers.length * 56 : 0);
    const items: any[] = showThemes ? themes : experts;
    const gridColumns: { item: any; index: number }[][] = [[], []];
    const heights = [0, 0];
    items.forEach((item, index) => {
      const target = heights[0] <= heights[1] ? 0 : 1;
      gridColumns[target].push({ item, index });
      heights[target] += estimate(item) + WEB_GAP;
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
          {smartHint}
          {items.length === 0 ? (
            listEmpty
          ) : (
            <View style={[styles.webGrid, { width: innerWidth }]}>
              {gridColumns.map((column, c) => (
                <View key={c} style={styles.webColumn}>
                  {column.map(({ item, index }) => (
                    <View key={item.id}>{showThemes ? renderTheme({ item, index }) : renderExpert({ item, index })}</View>
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
        data={(showThemes ? themes : experts) as any[]}
        keyExtractor={(item) => `${showThemes ? 't' : 'e'}${item.id}`}
        renderItem={showThemes ? renderTheme : renderExpert}
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
        ListHeaderComponent={
          <>
            {listHeader}
            {smartHint}
          </>
        }
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
  titleBlock: {
    gap: Spacings.sm,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
  },
  // Même gabarit que le bouton de fermeture du profil expert.
  back: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Le chevron paraît décentré vers la droite : léger recalage.
  backIcon: {
    marginLeft: -2,
  },
  backText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  titleInline: {
    maxWidth: undefined,
  },
  segment: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    padding: 4,
    gap: 4,
    borderRadius: 14,
    backgroundColor: Colors.lblue3,
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
    backgroundColor: Colors.lblue,
  },
  segmentText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.lblueDark,
  },
  segmentTextOn: {
    color: Colors.white,
  },
  // Collé au titre (l'écart du bloc est réduit pour ce seul texte).
  consultHint: {
    marginTop: -Spacings.xs,
    fontFamily: 'Roboto',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.subtext,
  },
  smartHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -Spacings.xs,
  },
  smartHintText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: Colors.lblueDark,
  },
  // Limité à 90 % de la largeur : le titre ne colle pas au bord droit.
  title: {
    maxWidth: '90%',
    fontFamily: 'Poppins-Bold',
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: -0.3,
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

  /* ---- Filtres (Consultation) ---- */
  filters: {
    gap: Spacings.sm,
    marginTop: Spacings.md,
  },
  filtersWeb: {
    flexDirection: 'row',
  },
  filtersPair: {
    flexDirection: 'row',
    gap: Spacings.sm,
  },
  filtersPairWeb: {
    flex: 2,
  },
  filterWrap: {
    marginTop: 0,
    paddingHorizontal: Spacings.sm,
    minWidth: 0,
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