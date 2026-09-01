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
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Dialog, Portal, Button } from 'react-native-paper';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';
import { Styles } from '../../../constants/Styles';

import { getFavourites, toggleFavourite } from '../../services/v2/FavouriteService';
import { sendError } from '../../services/v2/AuthService';

/** Grille fixe à quatre colonnes */
const COLUMNS = 4;

/** Rapport 16/9 de la vignette */
const THUMBNAIL_RATIO = 9 / 16;

/** Deux lignes de titre, réservées même quand le titre est court */
const TITLE_LINE_HEIGHT = 20;
const TITLE_BLOCK_HEIGHT = TITLE_LINE_HEIGHT * 2;

/** Ligne d'auteur, présente uniquement sur les médias */
const AUTHOR_LINE_HEIGHT = 18;

/** Marges intérieures du bloc d'informations */
const INFO_PADDING = Spacings.md;

const PAGE_SIZE = 20;

/** Distance au bas de la liste déclenchant le chargement suivant */
const LOAD_MORE_OFFSET = 300;

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

  /** Les médias affichent une ligne d'auteur en plus du titre */
  const showsAuthor = activeType !== 'infographic';

  const cardHeight =
    INFO_PADDING * 2 +
    TITLE_BLOCK_HEIGHT +
    (showsAuthor ? AUTHOR_LINE_HEIGHT + 2 : 0);

  /* ------------------------------------------------------------------ */
  /* Barre d'onglets : pastille glissant derrière l'onglet actif         */
  /* ------------------------------------------------------------------ */

  const pillLeft = useRef(new Animated.Value(TAB_PAD)).current;
  const pillWidth = useRef(new Animated.Value(0)).current;

  // Chaque onglet est mesuré : sa largeur dépend de la longueur du libellé
  const [tabLayouts, setTabLayouts] = useState<Record<string, { x: number; width: number }>>({});

  const activeLayout = activeType ? tabLayouts[activeType] : undefined;

  useEffect(() => {
    if (!activeLayout) return;

    // `x` est relatif au conteneur, dont le rembourrage est déjà pris
    // en compte : l'ajouter décalerait la pastille hors de la barre
    Animated.parallel([
      Animated.spring(pillLeft, {
        toValue: activeLayout.x,
        useNativeDriver: false,
        speed: 16,
        bounciness: 6,
      }),
      Animated.spring(pillWidth, {
        toValue: activeLayout.width,
        useNativeDriver: false,
        speed: 16,
        bounciness: 6,
      }),
    ]).start();
  }, [activeLayout, pillLeft, pillWidth]);

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
        if (isActive) sendError('favourite-view-web', error);
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
      if (loadingRef.current && !replace) return;

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
        sendError('favourite-view-web', error);
      } finally {
        loadingRef.current = false;
        replace ? setIsLoading(false) : setIsLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!activeType) return;

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
      sendError('favourite-view-web', error);
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
        params: { media: item },
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
      <View key={`${item.id}_${index}`} style={styles.cardSlot}>
        <TouchableOpacity
          style={styles.card}
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
                  size={34}
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
              <Ionicons name="heart" size={22} color={Colors.red} />
            </TouchableOpacity>
          </View>

          <View style={[styles.cardInfo, { height: cardHeight }]}>
            {showsAuthor && (
              <Text style={styles.cardAuthor} numberOfLines={1}>
                {item.author || ' '}
              </Text>
            )}

            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          </View>
        </TouchableOpacity>
      </View>
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
        <Text style={styles.headerTitle}>Mes favoris</Text>
      </View>

      {isInitializing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : availableTypes.length === 0 ? (
        renderEmpty()
      ) : (
        <View style={styles.body}>
          {/* Onglets : largeur au contenu, alignés à gauche */}
          <View style={styles.tabsRow}>
            <View style={styles.tabBar}>
              {activeLayout && (
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
                    onLayout={(e) => {
                      const { x, width } = e.nativeEvent.layout;
                      setTabLayouts((previous) => ({ ...previous, [tab.type]: { x, width } }));
                    }}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isActive }}
                  >
                    <Ionicons
                      name={isActive ? tab.icon : (`${tab.icon}-outline` as keyof typeof Ionicons.glyphMap)}
                      size={18}
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

          {isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.gridContent}
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
        </View>
      )}

      {/* Confirmation de retrait */}
      <Portal>
        <Dialog
          style={Styles.dialogWeb}
          visible={!!pendingRemoval}
          onDismiss={() => setPendingRemoval(null)}
        >
          <Dialog.Title style={Styles.dialogWebTitle}>Retirer ce contenu ?</Dialog.Title>
          <Dialog.Content>
            {/* L'icône rappelle de quel type de contenu il s'agit */}
            <View style={styles.dialogItem}>
              <Ionicons
                name={activeType ? ICONS[activeType] : 'heart'}
                size={18}
                color={Colors.gray}
              />
              <Text style={[Styles.dialogWebContent, styles.dialogItemTitle]} numberOfLines={3}>
                {pendingRemoval?.title}
              </Text>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              textColor={Colors.gray}
              labelStyle={styles.dialogButtonLabel}
              disabled={isRemoving}
              onPress={() => setPendingRemoval(null)}
            >
              Annuler
            </Button>
            <Button
              textColor={Colors.primary}
              labelStyle={styles.dialogButtonLabel}
              loading={isRemoving}
              disabled={isRemoving}
              onPress={confirmRemoval}
            >
              Retirer
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
    paddingTop: Spacings.sm,
    paddingBottom: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    height: 100,
  },
  backButton: {
    padding: 4,
    paddingRight: Spacings.md,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },

  /* ---- Onglets ---- */
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.lg,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    alignSelf: 'flex-start',
    padding: TAB_PAD,
    borderRadius: TAB_RADIUS + TAB_PAD,
    backgroundColor: Colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.line,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    // La pastille est positionnée en absolu : elle ne doit pas déborder
    overflow: 'hidden',
  },
  tabIndicator: {
    position: 'absolute',
    top: TAB_PAD,
    bottom: TAB_PAD,
    borderRadius: TAB_RADIUS,
    backgroundColor: Colors.primary,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.xs,
    paddingVertical: 9,
    paddingHorizontal: Spacings.lg,
    cursor: 'pointer',
  } as any,
  tabLabel: {
    fontSize: 13,
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
    paddingTop: Spacings.lg,
    paddingBottom: Spacings.xxl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cardSlot: {
    // Quatre colonnes fixes : la gouttière est portée par le rembourrage
    width: `${100 / COLUMNS}%`,
    padding: Spacings.sm,
  } as any,
  card: {
    borderRadius: 12,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    cursor: 'pointer',
  } as any,
  thumbnailWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
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
    top: Spacings.sm,
    right: Spacings.sm,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  } as any,
  cardInfo: {
    padding: INFO_PADDING,
  },
  cardAuthor: {
    fontSize: 12,
    lineHeight: AUTHOR_LINE_HEIGHT,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    lineHeight: TITLE_LINE_HEIGHT,
    // Hauteur figée : les cartes restent alignées quelle que soit la longueur
    height: TITLE_BLOCK_HEIGHT,
  },
  loadingFooter: {
    paddingVertical: Spacings.xl,
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
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    marginTop: Spacings.lg,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    textAlign: 'center',
    marginTop: Spacings.xs,
    lineHeight: 22,
  },

  /* ---- Dialogue ---- */
  dialogItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.sm,
  },
  dialogItemTitle: {
    flex: 1,
  },
  dialogButtonLabel: {
    fontFamily: 'Poppins-Medium',
  },
});

export default FavouriteView;