import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  StatusBar,
  Modal,
  Animated,
  Dimensions,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import { getFavourites, toggleFavourite } from '../../services/v2/FavouriteService';
import { sendError } from '../../services/v2/AuthService';

const { width } = Dimensions.get('window');
const isTablet = Platform.OS !== 'web' && width >= 768;

/** Deux colonnes, avec la gouttière et les marges latérales */
const CARD_WIDTH = (width - Spacings.lg * 2 - Spacings.md) / 2;

/** Hauteur de la vignette, déduite du format 16/9 */
const THUMBNAIL_HEIGHT = (CARD_WIDTH * 9) / 16;

/** Deux lignes de titre, réservées même quand le titre est court */
const TITLE_LINE_HEIGHT = 18;
const TITLE_BLOCK_HEIGHT = TITLE_LINE_HEIGHT * 2;

/** Ligne d'auteur, présente uniquement sur les médias */
const AUTHOR_LINE_HEIGHT = 16;

/** Marges intérieures du bloc d'informations */
const INFO_PADDING = Spacings.sm;

const PAGE_SIZE = 20;

/** Distance au bas de la liste déclenchant le chargement suivant */
const LOAD_MORE_OFFSET = 200;

/** Barre d'onglets : marge intérieure et arrondi de la pastille */
const TAB_PAD = 5;
const TAB_RADIUS = 14;

type FavouriteType = 'podcast' | 'video' | 'infographic';

type Tab = {
  type: FavouriteType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const TABS: Tab[] = [
  { type: 'podcast', label: 'Podcasts', icon: 'mic' },
  { type: 'video', label: 'Médias', icon: 'play' },
  { type: 'infographic', label: 'Infographies', icon: 'image' },
];

const ICONS: Record<FavouriteType, keyof typeof Ionicons.glyphMap> = {
  podcast: 'mic',
  video: 'play',
  infographic: 'image',
};

export const FavouriteView = ({ navigation }) => {
  // Hide bottom nav
  useEffect(() => {
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: 'none' }
    });

    return () => {
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'flex' }
      });
    };
  }, [navigation]);

  /** Catégories contenant au moins un favori */
  const [availableTypes, setAvailableTypes] = useState<FavouriteType[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  const [activeType, setActiveType] = useState<FavouriteType | null>(null);

  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [pendingRemoval, setPendingRemoval] = useState<any | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Empêche plusieurs chargements simultanés au défilement
  const loadingRef = useRef(false);

  const visibleTabs = TABS.filter((tab) => availableTypes.includes(tab.type));
  const activeIndex = visibleTabs.findIndex((tab) => tab.type === activeType);

  /** Les médias affichent une ligne d'auteur en plus du titre */
  const showsAuthor = activeType !== 'infographic';

  const cardHeight =
    THUMBNAIL_HEIGHT +
    INFO_PADDING * 2 +
    TITLE_BLOCK_HEIGHT +
    (showsAuthor ? AUTHOR_LINE_HEIGHT + 2 : 0);

  /* ------------------------------------------------------------------ */
  /* Barre d'onglets flottante                                           */
  /*                                                                     */
  /* Elle se superpose à la liste : sa hauteur est mesurée pour réserver */
  /* le même espace en haut du contenu, sinon la première rangée passe   */
  /* dessous dès le premier affichage.                                   */
  /* ------------------------------------------------------------------ */

  const [barWidth, setBarWidth] = useState(0);
  const [barHeight, setBarHeight] = useState(0);

  const pillLeft = useRef(new Animated.Value(TAB_PAD)).current;
  const pillWidth = useRef(new Animated.Value(0)).current;

  const innerWidth = Math.max(barWidth - TAB_PAD * 2, 0);
  const tabWidth = visibleTabs.length > 0 ? innerWidth / visibleTabs.length : 0;

  const targetLeft = TAB_PAD + tabWidth * Math.max(activeIndex, 0);

  useEffect(() => {
    if (innerWidth === 0 || activeIndex < 0) return;

    // `left` et `width` sont des propriétés de mise en page :
    // elles ne peuvent pas passer par le pilote natif
    Animated.parallel([
      Animated.spring(pillLeft, {
        toValue: targetLeft,
        useNativeDriver: false,
        speed: 16,
        bounciness: 6,
      }),
      Animated.spring(pillWidth, {
        toValue: tabWidth,
        useNativeDriver: false,
        speed: 16,
        bounciness: 6,
      }),
    ]).start();
  }, [targetLeft, tabWidth, innerWidth, activeIndex, pillLeft, pillWidth]);

  /* ------------------------------------------------------------------ */
  /* Premier appel : sert à savoir quelles catégories sont remplies      */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    let isActive = true;

    const init = async () => {
      try {
        const result = await getFavourites({
          podcastLimit: 1,
          videoLimit: 1,
          infographicLimit: 1,
        });

        if (!isActive) return;

        const filled = TABS
          .map((tab) => tab.type)
          .filter((type) => (result?.data?.[type]?.length ?? 0) > 0);

        setAvailableTypes(filled);
        setActiveType(filled[0] ?? null);
      } catch (error) {
        if (isActive) sendError('favourite-view', error);
      } finally {
        if (isActive) setIsInitializing(false);
      }
    };

    init();

    return () => {
      isActive = false;
    };
  }, []);

  /* ------------------------------------------------------------------ */
  /* Chargement d'une catégorie                                          */
  /* ------------------------------------------------------------------ */

  const loadPage = useCallback(
    async (type: FavouriteType, targetPage: number, replace: boolean) => {
      if (loadingRef.current) return;

      loadingRef.current = true;
      replace ? setIsLoading(true) : setIsLoadingMore(true);

      try {
        const result = await getFavourites({
          type,
          page: targetPage,
          limit: PAGE_SIZE,
        });

        const list = Array.isArray(result?.data) ? result.data : [];

        setItems((previous) => (replace ? list : [...previous, ...list]));
        setHasMore(!!result?.pagination?.hasMore);
        setPage(targetPage);
      } catch (error) {
        sendError('favourite-view', error);
      } finally {
        loadingRef.current = false;
        replace ? setIsLoading(false) : setIsLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!activeType) return;

    setItems([]);
    setHasMore(false);
    loadPage(activeType, 1, true);
  }, [activeType, loadPage]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!hasMore || loadingRef.current || !activeType) return;

    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;

    if (contentOffset.y + layoutMeasurement.height + LOAD_MORE_OFFSET >= contentSize.height) {
      loadPage(activeType, page + 1, false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Retrait d'un favori                                                 */
  /* ------------------------------------------------------------------ */

  const confirmRemoval = async () => {
    if (!pendingRemoval || !activeType || isRemoving) return;

    setIsRemoving(true);

    try {
      const ok = await toggleFavourite(pendingRemoval.id, activeType);

      if (!ok) {
        setIsRemoving(false);
        return;
      }

      const remaining = items.filter((item) => item.id !== pendingRemoval.id);
      setItems(remaining);

      // Dernier élément de la catégorie : l'onglet n'a plus lieu d'être
      if (remaining.length === 0 && !hasMore) {
        const filtered = availableTypes.filter((type) => type !== activeType);
        setAvailableTypes(filtered);
        setActiveType(filtered[0] ?? null);
      }
    } catch (error) {
      sendError('favourite-view', error);
    } finally {
      setIsRemoving(false);
      setPendingRemoval(null);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Navigation                                                          */
  /* ------------------------------------------------------------------ */

  const openItem = (item: any) => {
    if (activeType === 'video') {
      navigation.navigate('media', {
        screen: 'flash-media-preview',
        params: { id: item.id },
      });
      return;
    }

    if (activeType === 'podcast') {
      navigation.navigate('home', {
        screen: 'podcast',
        params: { podcastId: item.id },
      });
      return;
    }

    if (activeType === 'infographic') {
      navigation.navigate('home', {
        screen: 'infographic',
        params: { infographicId: item.id },
      });
      return;
    }
  };

  /* ------------------------------------------------------------------ */
  /* Rendu                                                               */
  /* ------------------------------------------------------------------ */

  const getThumbnail = (item: any) => {
    if (activeType === 'podcast') return item.image;
    if (activeType === 'infographic') return item.image;
    return item.thumbnail;
  };

  const renderCard = (item: any, index: number) => {
    const thumbnail = getThumbnail(item);

    return (
      <TouchableOpacity
        key={`${item.id}_${index}`}
        style={[styles.card, { height: cardHeight }]}
        activeOpacity={0.85}
        onPress={() => openItem(item)}
      >
        <View style={styles.thumbnailWrapper}>
          {thumbnail ? (
            <Image source={{ uri: thumbnail }} style={styles.thumbnail} resizeMode={showsAuthor ? 'cover' : 'contain'} />
          ) : (
            <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
              <Ionicons
                name={activeType ? ICONS[activeType] : 'heart'}
                size={30}
                color={Colors.subtext2}
              />
            </View>
          )}

          <TouchableOpacity
            style={styles.heartButton}
            activeOpacity={0.8}
            onPress={() => setPendingRemoval(item)}
            accessibilityRole="button"
            accessibilityLabel="Retirer des favoris"
          >
            <Ionicons name="heart" size={20} color={Colors.red} />
          </TouchableOpacity>
        </View>

        <View style={styles.cardInfo}>
          {showsAuthor && (
            <Text style={styles.cardAuthor} numberOfLines={1} ellipsizeMode='middle'>
              {item.author || ' '}
            </Text>
          )}

          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={70} color={Colors.gray} />
      <Text style={styles.emptyTitle}>Aucun contenu</Text>
      <Text style={styles.emptyText}>
        Les contenus que vous sauvegardez apparaîtront ici.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contenus sauvegardés</Text>
      </View>

      {isInitializing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : availableTypes.length === 0 ? (
        renderEmpty()
      ) : (
        <View style={styles.body}>
          {isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={[
                styles.gridContent,
                { paddingTop: barHeight + Spacings.xxl },
              ]}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              <View style={styles.grid}>
                {items.map(renderCard)}
              </View>

              {isLoadingMore && (
                <View style={styles.loadingFooter}>
                  <ActivityIndicator size="small" color={Colors.gray} />
                </View>
              )}
            </ScrollView>
          )}

          {/* Onglets : posés au-dessus de la liste, qui défile en dessous */}
          <View
            style={styles.tabBar}
            onLayout={(e) => {
              setBarWidth(e.nativeEvent.layout.width);
              setBarHeight(e.nativeEvent.layout.height);
            }}
          >
            {innerWidth > 0 && activeIndex >= 0 && (
              <Animated.View
                pointerEvents="none"
                style={[styles.tabIndicator, { left: pillLeft, width: pillWidth }]}
              />
            )}

            {visibleTabs.map((tab) => {
              const isActive = tab.type === activeType;

              return (
                <Pressable
                  key={tab.type}
                  style={styles.tab}
                  onPress={() => setActiveType(tab.type)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                >
                  <Ionicons
                    name={isActive ? tab.icon : (`${tab.icon}-outline` as keyof typeof Ionicons.glyphMap)}
                    size={24}
                    color={isActive ? Colors.white : Colors.gray}
                  />
                  <Text
                    style={[styles.tabLabel, isActive && styles.tabLabelActive]}
                    numberOfLines={1}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Confirmation de retrait */}
      <Modal
        visible={!!pendingRemoval}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingRemoval(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="heart-dislike" size={50} color={Colors.primary} />
            </View>

            <Text style={styles.modalTitle}>Retirer ce contenu</Text>

            {/* L'icône rappelle de quel type de contenu il s'agit */}
            <View style={styles.modalItem}>
              <Ionicons
                name={activeType ? ICONS[activeType] : 'heart'}
                size={18}
                color={Colors.gray}
              />
              <Text style={styles.modalItemTitle} numberOfLines={3}>
                {pendingRemoval?.title}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonGhost]}
                onPress={() => setPendingRemoval(null)}
                disabled={isRemoving}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonGhostText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={confirmRemoval}
                disabled={isRemoving}
                activeOpacity={0.8}
              >
                {isRemoving ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.modalButtonText}>Retirer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  body: {
    flex: 1,
    backgroundColor: Colors.grayLight,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ---- Header ---- */
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacings.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: isTablet ? 100 : 60,
    // Détache le header du contenu qui défile en dessous
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 10,
  },
  backButton: {
    padding: 4,
    paddingRight: Spacings.md,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },

  /* ---- Onglets ---- */
  tabBar: {
    position: 'absolute',
    top: Spacings.md,
    left: Spacings.lg,
    right: Spacings.lg,
    flexDirection: 'row',
    alignItems: 'stretch',
    padding: TAB_PAD,
    borderRadius: TAB_RADIUS + TAB_PAD,
    backgroundColor: Colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.line,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 5,
  },
  tabIndicator: {
    position: 'absolute',
    top: TAB_PAD,
    bottom: TAB_PAD,
    borderRadius: TAB_RADIUS,
    backgroundColor: Colors.primary,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 4,
    gap: 3,
  },
  tabLabel: {
    fontSize: 12.5,
    letterSpacing: 0.1,
    fontFamily: 'Poppins-Medium',
    color: Colors.gray,
  },
  tabLabelActive: {
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
  },

  /* ---- Grille ---- */
  scrollView: {
    flex: 1,
  },
  gridContent: {
    paddingHorizontal: Spacings.lg,
    paddingBottom: Spacings.xxl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.md,
  },
  card: {
    width: CARD_WIDTH,
    marginBottom: Spacings.md,
    borderRadius: 12,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  thumbnailWrapper: {
    width: '100%',
    height: THUMBNAIL_HEIGHT,
    backgroundColor: Colors.line,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartButton: {
    position: 'absolute',
    top: Spacings.xs,
    right: Spacings.xs,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    padding: INFO_PADDING,
  },
  cardAuthor: {
    fontSize: 11,
    lineHeight: AUTHOR_LINE_HEIGHT,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    letterSpacing: 0.2
  },
  cardTitle: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    lineHeight: TITLE_LINE_HEIGHT,
    // Hauteur figée : les cartes restent alignées quelle que soit la longueur
    height: TITLE_BLOCK_HEIGHT,
  },
  loadingFooter: {
    paddingVertical: Spacings.lg,
    alignItems: 'center',
  },

  /* ---- Vide ---- */
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacings.xl,
    marginBottom: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    marginTop: Spacings.lg,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    textAlign: 'center',
    marginTop: Spacings.xs,
    lineHeight: 20,
  },

  /* ---- Modal ---- */
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: Spacings.xl,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacings.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: Spacings.md,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    marginBottom: Spacings.sm,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: Spacings.xs,
    marginBottom: Spacings.xl,
    paddingHorizontal: Spacings.sm,
  },
  modalItemTitle: {
    flexShrink: 1,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacings.sm,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacings.sm,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
  },
  modalButtonPrimary: {
    backgroundColor: Colors.primary,
  },
  modalButtonGhost: {
    borderWidth: 1,
    borderColor: Colors.line,
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
  modalButtonGhostText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.gray,
  },
});

export default FavouriteView;