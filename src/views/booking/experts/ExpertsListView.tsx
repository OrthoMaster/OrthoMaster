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
  Keyboard,
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
  BookingMode,
  BookingTheme,
  getBookingExpert,
  getBookingExperts,
  getBookingThemes,
  getBookingCities,
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
/** Web : nombre de colonnes selon la largeur du contenu (une carte fait au moins ~340 px). */
const WEB_TWO_COLUMNS_FROM = 760;
const WEB_THREE_COLUMNS_FROM = 1200;
const WEB_MAX_WIDTHS = [640, 1000, 1320];
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
  const columns = !IS_WEB ? 1 : contentWidth >= WEB_THREE_COLUMNS_FROM ? 3 : contentWidth >= WEB_TWO_COLUMNS_FROM ? 2 : 1;
  const twoColumns = columns > 1;
  const innerWidth = IS_WEB
    ? Math.min(contentWidth - LIST_PADDING * 2, WEB_MAX_WIDTHS[columns - 1])
    : screenWidth - LIST_PADDING * 2;
  const cardWidth = (innerWidth - WEB_GAP * (columns - 1)) / columns;
  // Liste Experts : une seule carte dépliée à la fois.
  const [openExpertId, setOpenExpertId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  // Filtres combinables avec la recherche par domaine / besoin (IA) : Nom de l'expert,
  // et pour les thèmes Ville (lieu de présentiel), avec autocomplétion.
  const [nameFilter, setNameFilter] = useState('');
  const [nameQuery, setNameQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [citySuggestOpen, setCitySuggestOpen] = useState(false);

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
    ? { name: nameQuery || undefined }
    : { name: nameQuery || undefined, city: cityQuery || undefined };

  // Ville : propositions pendant la saisie (villes des lieux des experts).
  const [cityTyping, setCityTyping] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setCityTyping(cityFilter.trim()), 250);
    return () => clearTimeout(timer);
  }, [cityFilter]);
  const { data: citySuggestions } = useQuery({
    queryKey: ['booking', 'cities', cityTyping],
    queryFn: () => getBookingCities(cityTyping),
    enabled: !consultationMode && citySuggestOpen,
    staleTime: 5 * 60 * 1000,
  });
  const suggestions = (citySuggestions ?? []).filter((c) => c.city.toLowerCase() !== cityFilter.trim().toLowerCase());

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
    queryKey: ['booking', 'themes', nameQuery, cityQuery],
    queryFn: async ({ pageParam }) => {
      const page = await getBookingThemes({ page: pageParam, ...filters });
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
        ? await smartSearchThemes(query, filters)
        : await smartSearchExperts(query, consultationMode ? { consultation: 1, ...filters } : filters);
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

  /**
   * Thème choisi (liste Thèmes, ou thème d'une carte Experts) : la fiche de l'expert (offres complètes,
   * lieux) est chargée puis l'écran Réserver s'ouvre ; avec un format, sur ce format et son calendrier.
   */
  const openOffer = async (expertId: number, offerId: number, mode?: BookingMode) => {
    if (openingThemeId) return;
    setOpeningThemeId(offerId);
    try {
      const detail = await queryClient.fetchQuery({
        queryKey: ['booking', 'expert', expertId],
        queryFn: () => getBookingExpert(expertId),
      });
      const offer = detail?.offers.find((o) => o.id === offerId);
      if (!detail || !offer) {
        notify('Thème indisponible', "Ce thème n'est plus proposé. Tirez la liste pour la rafraîchir.");
        return;
      }
      navigation.navigate('expert-offer', {
        expertId,
        offer,
        ...(mode ? { mode, initialTab: 'calendar' } : {}),
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
  const openTheme = (theme: BookingTheme) => openOffer(theme.expert.id, theme.id);

  // Profil depuis une carte Thème : l'aperçu donne l'en-tête tout de suite.
  const openThemeExpert = (theme: BookingTheme) =>
    navigation.navigate('expert-profile', {
      expertId: theme.expert.id,
      preview: {
        ...theme.expert,
        honorific: null,
        lede: null,
        slug: null,
        palette: null,
        online: true,
      },
    });

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
        onMessage={() => messageExpert(item)}
        onBook={() => navigation.navigate('consultation-request', { expertId: item.id, preview: item })}
        messaging={messagingId === item.id}
      />
    ) : (
    <ExpertCard
      expert={item}
      width={cardWidth}
      indexInPage={index % PER_PAGE}
      open={openExpertId === item.id}
      onToggle={() => setOpenExpertId((current) => (current === item.id ? null : item.id))}
      // Thème ou format touché : directement l'écran Réserver.
      onOfferPress={(offerId, mode) => openOffer(item.id, offerId, mode)}
      openingOfferId={openingThemeId}
      // L'aperçu affiche l'en-tête du profil tout de suite, sans attendre la requête.
      onProfile={() => navigation.navigate('expert-profile', { expertId: item.id, preview: item })}
    />
    );

  const renderTheme = ({ item, index }: { item: BookingTheme; index: number }, stretch?: boolean) => (
    <ThemeCard
      theme={item}
      width={cardWidth}
      indexInPage={index % PER_PAGE}
      opening={openingThemeId === item.id}
      stretch={stretch}
      onPress={() => openTheme(item)}
      onExpertPress={() => openThemeExpert(item)}
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
        IS_WEB && focusedField === key && { borderColor: accent },
      ]}
    >
      <Ionicons name={icon} size={17} color={key === 'domain' ? accent : Colors.subtext} />
      <TextInput
        style={[styles.searchInput, IS_WEB && styles.searchInputWeb]}
        onFocus={() => {
          setFocusedField(key);
          if (key === 'city') setCitySuggestOpen(true);
        }}
        onBlur={() => {
          setFocusedField((f) => (f === key ? null : f));
          // Laisse le temps à un toucher sur une proposition d'arriver.
          if (key === 'city') setTimeout(() => setCitySuggestOpen(false), 200);
        }}
        value={value}
        onChangeText={(text) => {
          onChange(text);
          if (key === 'city') setCitySuggestOpen(true);
        }}
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
    <View style={[styles.head, IS_WEB && { width: innerWidth, alignSelf: 'center' }]}>
      {/* Parcours en cours à gauche ; à droite, bouton rond de fermeture (même gabarit que celui du profil). */}
      <View style={styles.topRow}>
        <Text style={[styles.kicker, { color: accent }]}>{consultationMode ? 'Consultation' : 'Thèmes'}</Text>
        {navigation.canGoBack() ? (
          <TouchableOpacity
            style={[styles.close, { borderColor: withAlpha(accent, 0.45), backgroundColor: withAlpha(accent, 0.1) }]}
            onPress={() => navigation.goBack()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Fermer"
          >
            <Ionicons name="close" size={26} color={accent} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View>
      <View style={styles.titleBlock}>
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

      {/* Filtres combinables : domaine / besoin (IA), nom, et ville pour les thèmes. Sur une ligne sur grand écran. */}
      <View style={[styles.filters, twoColumns && styles.filtersWeb]}>
        {filterField('domain', 'sparkles-outline', search, setSearch, showThemes ? 'Besoin, sujet…' : 'Domaine, besoin…', twoColumns ? 2 : undefined)}
        {twoColumns || consultationMode ? (
          <>
            {filterField('name', 'person-outline', nameFilter, setNameFilter, "Nom de l'expert", twoColumns ? 1 : undefined)}
            {!consultationMode ? filterField('city', 'location-outline', cityFilter, setCityFilter, 'Ville', 1) : null}
          </>
        ) : (
          // Écran étroit : Nom et Ville côte à côte, pour garder la liste visible.
          <View style={styles.filtersPair}>
            {filterField('name', 'person-outline', nameFilter, setNameFilter, 'Nom', 1)}
            {filterField('city', 'location-outline', cityFilter, setCityFilter, 'Ville', 1)}
          </View>
        )}
      </View>

      {/* Ville : propositions sous les filtres pendant la saisie. */}
      {!consultationMode && citySuggestOpen && suggestions.length > 0 ? (
        // Grand écran : sous le champ Ville (mêmes parts que la ligne des filtres).
        <View style={twoColumns ? [styles.filtersWeb, { gap: Spacings.sm }] : null}>
          {twoColumns ? <View style={{ flex: 2 }} /> : null}
          {twoColumns ? <View style={{ flex: 1 }} /> : null}
        <View style={[styles.suggestions, twoColumns && { flex: 1 }]}>
          {suggestions.slice(0, 6).map((c) => (
            <TouchableOpacity
              key={c.city}
              style={styles.suggestion}
              onPress={() => {
                setCityFilter(c.city);
                setCitySuggestOpen(false);
                Keyboard.dismiss();
              }}
              accessibilityRole="button"
            >
              <Ionicons name="location-outline" size={16} color={accent} />
              <Text style={styles.suggestionText}>{c.city}</Text>
              <Text style={styles.suggestionCount}>
                {c.experts} expert{c.experts > 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        </View>
      ) : null}
      </View>
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

  /* ---- Web, grand écran : 2 ou 3 colonnes ---- */
  if (twoColumns) {
    // Experts : colonnes indépendantes (une carte dépliée ne pousse que sa colonne) ; chaque carte
    // va dans la colonne la moins remplie, d'après sa hauteur repliée estimée.
    // Thèmes : rangées de cartes à hauteur égale.
    const estimate = (item: any) =>
      (consultationMode ? 200 : 150) + Math.ceil((item.domains?.length ?? 0) / 3) * 24 + (item.reason ? 40 : 0);
    const items: any[] = showThemes ? themes : experts;
    const gridColumns: { item: any; index: number }[][] = Array.from({ length: columns }, () => []);
    const heights = Array(columns).fill(0);
    const rows: { item: any; index: number }[][] = [];
    items.forEach((item, index) => {
      if (showThemes) {
        if (index % columns === 0) rows.push([]);
        rows[rows.length - 1].push({ item, index });
        return;
      }
      const target = heights.indexOf(Math.min(...heights));
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
        {/* En-tête et filtres fixes : seule la liste défile. */}
        <View style={[styles.fixedHead, styles.listWeb]}>
          {listHeader}
          {smartHint}
        </View>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.list, styles.listWeb, styles.listBody, { paddingBottom: bottomInset + Spacings.md }]}
          onScroll={onScroll}
          scrollEventThrottle={200}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {items.length === 0 ? (
            listEmpty
          ) : (
            showThemes ? (
              <View style={[styles.webRows, { width: innerWidth }]}>
                {rows.map((row, r) => (
                  <View key={r} style={styles.webRow}>
                    {row.map(({ item, index }) => (
                      <View key={item.id} style={{ width: cardWidth }}>
                        {renderTheme({ item, index }, true)}
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            ) : (
              <View style={[styles.webGrid, { width: innerWidth }]}>
                {gridColumns.map((column, c) => (
                  <View key={c} style={styles.webColumn}>
                    {column.map(({ item, index }) => (
                      <View key={item.id}>{renderExpert({ item, index })}</View>
                    ))}
                  </View>
                ))}
              </View>
            )
          )}
          {listFooter}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.grayLight} />

      {/* En-tête et filtres fixes : seule la liste défile. */}
      <View style={[styles.fixedHead, IS_WEB && styles.listWeb]}>
        {listHeader}
        {smartHint}
      </View>

      <FlatList
        style={styles.flex}
        data={(showThemes ? themes : experts) as any[]}
        keyExtractor={(item) => `${showThemes ? 't' : 'e'}${item.id}`}
        renderItem={showThemes ? (info) => renderTheme(info) : renderExpert}
        contentContainerStyle={[styles.list, IS_WEB && styles.listWeb, styles.listBody, { paddingBottom: bottomInset + Spacings.md }]}
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
  flex: {
    flex: 1,
  },
  // En-tête fixe au-dessus de la liste ; la marge basse laisse place à l'ombre des cartes.
  fixedHead: {
    paddingHorizontal: LIST_PADDING,
    paddingBottom: Spacings.xs,
  },
  // Haut de liste : l'ombre de la première carte n'est pas rognée.
  listBody: {
    paddingTop: Spacings.sm,
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
  webRows: {
    gap: WEB_GAP,
  },
  // Rangée de thèmes : chaque carte prend la hauteur de la plus haute.
  webRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: WEB_GAP,
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
  // Ligne du haut : parcours à gauche, fermeture à droite (hauteur du bouton, même sans lui).
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 46,
    marginBottom: Spacings.xs,
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
  kicker: {
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

  searchInputWeb: {
    outlineStyle: 'none',
  } as any,

  /* ---- Ville : propositions ---- */
  suggestions: {
    marginTop: Spacings.xs,
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    paddingHorizontal: Spacings.sm,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  suggestionText: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.text,
  },
  suggestionCount: {
    fontFamily: 'Roboto',
    fontSize: 12,
    color: Colors.subtext,
  },

  /* ---- Filtres ---- */
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