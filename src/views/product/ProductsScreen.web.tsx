import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CommonActions } from '@react-navigation/native';
import {
  ActivityIndicator,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FilterSummaryModal } from './components/FilterSummaryModal';
import { ManufacturerPriorityModal } from './components/ManufacturerPriorityModal';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ShareQrModal } from './components/ShareQrModal';

import { MainNode, Selections } from './lib/Logic';
import { Product } from './lib/Products';
import { SAMPLE_NODES } from './lib/SampleRules';
import { palette } from './lib/Theme';

import {
  filterProducts,
  getProduct,
  ProductDetail,
  ProductListItem,
} from '../../services/v2/ProductService';

// Base URL for QR-encoded deep links. Change to your real domain.
const SHARE_URL_BASE = 'https://go.orthomaster.fr/open/products-view';

// Fixed list of manufacturers. Adjust to match your real lookup table.
const ALL_MANUFACTURERS: string[] = [
  'Innothera-Gibaud',
  'Enovis-Donjoy',
  'Thuasne',
  'Orliman',
  'Medi',
  'L&R-Velpeau',
  'Cooper-Salva',
  'Bauerfeind',
  'Sigvaris-Mobilis',
  'Cizeta',
  'Essity-Actimovee',
];

// AsyncStorage key for the saved priority order.
const MFG_PRIORITY_KEY = '@orthomaster/manufacturer_priority';

// Pixel threshold past which the scroll-to-top FAB becomes visible.
const SCROLL_TOP_THRESHOLD = 300;

// Right-panel state. summary = FilterSummary (default); detail = a product
// detail is open. There is no explicit "closed" — the panel is always shown.
type PanelMode = 'summary' | 'detail';

// Flatten Selections (nodeId → childId[]) to a flat list of childIds.
function flattenSelections(selections: Selections): string[] {
  return Object.values(selections).flat();
}

// Rebuild Selections object from a flat list of childIds — used when the
// screen is opened from a QR scan that only carries the flat list.
function flatToSelections(flat: string[], nodes: MainNode[]): Selections {
  const set = new Set(flat);
  const result: Selections = {};
  for (const node of nodes) {
    const matched = node.children
      .filter(c => set.has(c.id))
      .map(c => c.id);
    if (matched.length > 0) result[node.id] = matched;
  }
  return result;
}

function listItemToCardProduct(item: ProductListItem): Product {
  return {
    id: item.id,
    name: item.name,
    sub: item.sub ?? null,
    manufacturer: item.manufacturer ?? '',
    category: item.category,
    images: item.image ? [item.image] : [],
    tags: [],
  };
}

function detailToModalProduct(d: ProductDetail): Product {
  return {
    id: d.id,
    name: d.name,
    sub: d.sub ?? null,
    manufacturer: d.manufacturer ?? '',
    category: d.category,
    images: d.images,
    tags: d.tags,
    description_tabs: d.description_tabs,
    sizes: d.sizes
  } as Product;
}

export const ProductsScreen = ({ navigation, route }) => {
  // Two entry points for filters:
  //   1. route.params.selections  (from SolarFilterScreen — full object)
  //   2. route.params.filters     (from QR scan — flat string[] OR CSV string)
  const selections: Selections = useMemo(() => {
    if (route?.params?.selections) {
      return route.params.selections;
    }
    const raw = route?.params?.filters;
    if (!raw) return {};
    const flat: string[] = Array.isArray(raw)
      ? raw
      : String(raw).split(',').map(s => s.trim()).filter(Boolean);
    return flatToSelections(flat, SAMPLE_NODES);
  }, [route?.params?.selections, route?.params?.filters]);

  // Protocol group filter — when set, the backend narrows the product list.
  const groupId: string | null = useMemo(() => {
    const g = route?.params?.groupId ?? route?.params?.group;
    return typeof g === 'string' && g !== '' ? g : null;
  }, [route?.params?.groupId, route?.params?.group]);

  const groupLabel: string | null = useMemo(() => {
    const l = route?.params?.groupLabel;
    return typeof l === 'string' && l !== '' ? l : null;
  }, [route?.params?.groupLabel]);

  const [shareOpen, setShareOpen] = useState(false);
  const [mfgModalOpen, setMfgModalOpen] = useState(false);

  // Right panel content mode. Defaults to the filter summary and switches
  // to 'detail' when a product is opened. Détails button forces 'summary'.
  const [panelMode, setPanelMode] = useState<PanelMode>('summary');

  // Manufacturer priority — loaded from AsyncStorage on mount.
  const [mfgPriority, setMfgPriority] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(MFG_PRIORITY_KEY)
      .then(raw => {
        if (cancelled || !raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setMfgPriority(parsed.filter(m => ALL_MANUFACTURERS.includes(m)));
          }
        } catch {
          // ignore corrupt storage
        }
      });
    return () => { cancelled = true; };
  }, []);

  const handleApplyMfgPriority = (next: string[]) => {
    setMfgPriority(next);
    AsyncStorage.setItem(MFG_PRIORITY_KEY, JSON.stringify(next)).catch(() => { });
  };

  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(false);

  // Product currently shown in the right panel (when panelMode === 'detail').
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Scroll-to-top FAB state.
  const listRef = useRef<FlatList>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const onListScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const shouldShow = y > SCROLL_TOP_THRESHOLD;
    setShowScrollTop(prev => (prev === shouldShow ? prev : shouldShow));
  }, []);

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const totalSelected = Object.values(selections).reduce(
    (s, a) => s + a.length,
    0,
  );

  // Build the URL the QR code will encode.
  const flatFilters = useMemo(() => flattenSelections(selections), [selections]);
  const userFilters = useMemo(() => new Set(flatFilters), [flatFilters]);
  const shareUrl = useMemo(() => {
    const params: string[] = [];
    if (flatFilters.length > 0) {
      params.push(`filters=${encodeURIComponent(flatFilters.join(','))}`);
    }
    if (groupId) {
      params.push(`group=${encodeURIComponent(groupId)}`);
    }
    return params.length === 0
      ? SHARE_URL_BASE
      : `${SHARE_URL_BASE}?${params.join('&')}`;
  }, [flatFilters, groupId]);

  const fetchSeqRef = useRef(0);
  const fetchList = () => {
    const mySeq = ++fetchSeqRef.current;
    setListLoading(true);
    setListError(false);

    filterProducts(flatFilters, groupId)
      .then(items => {
        if (mySeq !== fetchSeqRef.current) return;
        setProducts(items);
        setListLoading(false);
      })
      .catch(() => {
        if (mySeq !== fetchSeqRef.current) return;
        setListError(true);
        setListLoading(false);
      });
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selections, groupId]);

  // Sort products by manufacturer priority.
  const sortedProducts = useMemo(() => {
    if (mfgPriority.length === 0) return products;

    const rank = new Map<string, number>();
    mfgPriority.forEach((name, i) => rank.set(name, i));

    return [...products].sort((a, b) => {
      const ra = rank.get(a.manufacturer ?? '') ?? Number.POSITIVE_INFINITY;
      const rb = rank.get(b.manufacturer ?? '') ?? Number.POSITIVE_INFINITY;
      return ra - rb;
    });
  }, [products, mfgPriority]);

  const handleBack = useCallback(() => {
    const state = navigation.getState();
    const hasSolarFilterInStack = state.routes.some(r => r.name === 'new-que-choisir');

    if (hasSolarFilterInStack) {
      navigation.goBack();
      return;
    }

    navigation.dispatch(CommonActions.reset({
      index: 0,
      routes: [{
        name: 'new-que-choisir',
        params: {
          filters: route?.params?.filters,
          group: route?.params?.group,
        },
      }],
    }));
  }, [navigation, route]);

  const handleResetFilters = () => {
    navigation.navigate('new-que-choisir', { reset: true });
  };

  // Détails button → show the filter summary in the right panel.
  const handleShowSummary = useCallback(() => {
    setPanelMode('summary');
  }, []);

  // Open a product's detail INTO the right panel (not a modal).
  const handleOpenDetail = async (item: ProductListItem) => {
    setDetailLoading(true);
    setPanelMode('detail');
    const detail = await getProduct(item.id);
    setDetailLoading(false);
    if (detail) {
      setDetailProduct(detailToModalProduct(detail));
    } else {
      setDetailProduct(listItemToCardProduct(item));
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.bg} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* Two-column split: left = products list (50%), right = context
            panel (50%). Same pattern as SolarFilterScreen. 50% is of the
            space left of the app's left nav — handled automatically since
            this screen already renders inside that remaining area. */}
        <View style={styles.splitRow}>
          {/* ============ LEFT: products ============ */}
          <View style={styles.leftPane}>
            {/* Top bar */}
            <View style={styles.topBar}>
              <View style={styles.topRow}>
                <TouchableOpacity
                  onPress={handleBack}
                  style={styles.backBtn}
                  hitSlop={10}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={22} color={palette.textPrimary} />
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={1}>
                    {groupLabel ?? 'Produits'}
                  </Text>
                  <Text style={styles.bannerText} numberOfLines={1}>
                    {listLoading
                      ? 'Chargement des produits …'
                      : listError
                        ? 'Impossible de charger les produits'
                        : products.length === 0
                          ? 'Aucun produit ne correspond à vos filtres'
                          : `${products.length} produit${products.length > 1 ? 's' : ''} trouvé${products.length > 1 ? 's' : ''}`}
                  </Text>
                </View>

                <View style={styles.topVerticalDivider} />

                {/* Right side: labeled group with two icon+text actions */}
                <View style={styles.rightGroup}>
                  <Text style={styles.rightLabel}>Filtres Patient</Text>
                  <View style={styles.rightButtons}>
                    <TouchableOpacity
                      style={[styles.actionBtn, totalSelected === 0 && styles.actionBtnDisabled]}
                      onPress={handleShowSummary}
                      activeOpacity={0.85}
                      disabled={totalSelected === 0}
                    >
                      <Ionicons
                        name="list"
                        size={18}
                        color={totalSelected === 0 ? palette.textMuted : palette.textPrimary}
                      />
                      <Text
                        style={[
                          styles.actionBtnText,
                          { color: totalSelected === 0 ? palette.textMuted : palette.textPrimary },
                        ]}
                      >
                        Détails
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionBtnPrimary, totalSelected === 0 && styles.actionBtnPrimaryDisabled]}
                      onPress={() => setShareOpen(true)}
                      activeOpacity={0.85}
                      disabled={totalSelected === 0}
                    >
                      <Ionicons
                        name="share-outline"
                        size={18}
                        color={totalSelected === 0 ? palette.textMuted : palette.textPrimary}
                      />
                      <Text
                        style={[
                          styles.actionBtnText,
                          { color: totalSelected === 0 ? palette.textMuted : palette.textPrimary },
                        ]}
                      >
                        Partager
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {/* Body container */}
            <View style={styles.bodyContainer}>
              {/* Secondary filter pills (manufacturer) */}
              <View style={styles.pillsRow}>
                <TouchableOpacity
                  style={[styles.pill, mfgPriority.length > 0 && styles.pillActive]}
                  activeOpacity={0.7}
                  onPress={() => setMfgModalOpen(true)}
                >
                  <Ionicons
                    name="business-outline"
                    size={14}
                    color={mfgPriority.length > 0 ? '#3B82F6' : palette.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.pillText, mfgPriority.length > 0 && styles.pillTextActive]}>
                    Fabricant
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={14}
                    color={mfgPriority.length > 0 ? '#3B82F6' : palette.textMuted}
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
              </View>

              {/* Body */}
              {listLoading ? (
                <View style={styles.centered}>
                  <ActivityIndicator size="large" color={palette.fabBg} />
                </View>
              ) : listError ? (
                <View style={styles.empty}>
                  <Ionicons name="cloud-offline-outline" size={36} color={palette.textMuted} />
                  <Text style={styles.emptyTitle}>Erreur réseau</Text>
                  <Text style={styles.emptySub}>
                    Nous n'avons pas pu joindre le serveur. Veuillez réessayer.
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyBtn}
                    onPress={fetchList}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.emptyBtnText}>Veuillez réessayer</Text>
                  </TouchableOpacity>
                </View>
              ) : products.length === 0 ? (
                <View style={styles.empty}>
                  <Ionicons name="search-outline" size={36} color={palette.textMuted} />
                  <Text style={styles.emptyTitle}>Aucun résultat trouvé.</Text>
                  <Text style={styles.emptySub}>
                    Ajustez vos filtres de pathologie pour voir les résultats.
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyBtn}
                    onPress={handleBack}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.emptyBtnText}>Retour aux filtres</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  ref={listRef}
                  data={sortedProducts}
                  keyExtractor={p => p.id}
                  numColumns={2}
                  columnWrapperStyle={styles.columnWrapper}
                  renderItem={({ item }) => (
                    <View style={styles.cardCell}>
                      <ProductCard
                        product={listItemToCardProduct(item)}
                        onPress={() => handleOpenDetail(item)}
                      />
                    </View>
                  )}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  onScroll={onListScroll}
                  scrollEventThrottle={64}
                />
              )}
            </View>

            {/* Scroll-to-top FAB — floats over the left pane list only. */}
            {showScrollTop && (
              <TouchableOpacity
                style={styles.scrollTopBtn}
                onPress={scrollToTop}
                activeOpacity={0.85}
                hitSlop={6}
                accessibilityLabel="Remonter en haut"
              >
                <Ionicons name="arrow-up" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>

          {/* ============ RIGHT: context panel (always visible) ============ */}
          <View style={styles.rightPane}>
            {panelMode === 'detail' ? (
              detailLoading && !detailProduct ? (
                <View style={styles.centered}>
                  <ActivityIndicator size="large" color={palette.fabBg} />
                </View>
              ) : (
                <ProductDetailModal
                  embedded
                  visible={!!detailProduct}
                  product={detailProduct}
                  userFilters={userFilters}
                  onClose={() => setPanelMode('summary')}
                />
              )
            ) : (
              <FilterSummaryModal
                embedded
                visible
                onClose={() => {}}
                onReset={handleResetFilters}
                nodes={SAMPLE_NODES}
                selections={selections}
              />
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* Modals kept as overlays on web */}
      <ShareQrModal
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        url={shareUrl}
        caption="Scannez ce code pour voir la même sélection de produits."
      />

      <ManufacturerPriorityModal
        visible={mfgModalOpen}
        onClose={() => setMfgModalOpen(false)}
        allManufacturers={ALL_MANUFACTURERS}
        initialPriority={mfgPriority}
        onApply={handleApplyMfgPriority}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  // Split container: two equal columns.
  splitRow: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPane: {
    flex: 6,
    flexBasis: 0,
    borderRightWidth: 1,
    borderRightColor: palette.border,
  },
  rightPane: {
    flex: 4,
    flexBasis: 0,
    backgroundColor: palette.cardBg,
  },

  bodyContainer: { flex: 1, backgroundColor: palette.bg },

  topBar: {
    height: 100,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: palette.cardBg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.textPrimary,
    letterSpacing: -0.4,
  },
  bannerText: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.textSecondary,
    marginTop: 1,
  },

  topVerticalDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: palette.border,
    marginHorizontal: 10,
  },

  rightGroup: {
    alignItems: 'flex-end',
  },
  rightLabel: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: palette.textMuted,
  },
  rightButtons: {
    flexDirection: 'row',
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    minWidth: 50,
  },
  actionBtnPrimary: {
    paddingLeft: 12,
  },
  actionBtnDisabled: {
    opacity: 0.55,
  },
  actionBtnPrimaryDisabled: {
    backgroundColor: palette.bg,
    borderWidth: 1,
    borderColor: palette.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  actionBtnText: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    marginTop: 0,
    letterSpacing: 0.2,
  },

  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: palette.bg,
    borderWidth: 1,
    borderColor: palette.border,
  },
  pillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  pillText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: palette.textSecondary,
  },
  pillTextActive: {
    color: '#3B82F6',
    fontWeight: '700',
  },

  listContent: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  // Row of two cards in the 2-column grid — the gap here is the spacing
  // BETWEEN columns. It's kept equal to cardCell's marginBottom (the row
  // spacing) so horizontal and vertical gaps match.
  columnWrapper: {
    gap: 12,
  },
  // Each card takes half the row; flex:1 with the wrapper gap splits evenly.
  cardCell: {
    flex: 1,
    marginBottom: 0,
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
    marginTop: 14,
  },
  emptySub: {
    fontSize: 13,
    color: palette.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyBtn: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: palette.fabBg,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  // Scroll-to-top FAB — bottom-right of the LEFT pane.
  scrollTopBtn: {
    position: 'absolute',
    bottom: 22,
    right: 22,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
  },
});