import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
import { ManufacturerPriorityModal } from './components/ManufacturerPriorityModal';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ShareQrModal } from './components/ShareQrModal';

import { MainNode, Selections } from './lib/Logic';
import { Product } from './lib/Products';
import { SAMPLE_NODES } from './lib/SampleRules';
import { palette } from './lib/Theme';
import Colors from '../../../constants/Colors'

import {
  filterProducts,
  getProduct,
  ProductDetail,
  ProductListItem,
} from '../../services/v2/ProductService';

// Base URL for QR-encoded deep links. Change to your real domain.
// React Navigation linking config should match this prefix.
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
// Tuned so it doesn't appear on the first card or two — only after the
// user has scrolled far enough to genuinely want a fast way back up.
const SCROLL_TOP_THRESHOLD = 300;

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
  // We prefer (1) when both present.
  const selections: Selections = useMemo(() => {
    if (route?.params?.selections) {
      return route.params.selections;
    }
    const raw = route?.params?.filters;
    if (!raw) return {};
    // React Navigation linking parse() may give us a string OR array
    const flat: string[] = Array.isArray(raw)
      ? raw
      : String(raw).split(',').map(s => s.trim()).filter(Boolean);
    return flatToSelections(flat, SAMPLE_NODES);
  }, [route?.params?.selections, route?.params?.filters]);

  // Protocol group filter — when set, the backend narrows the product
  // list to those tagged with this group id. Two entry points:
  //   1. route.params.groupId    (from ProtocolScreen — in-app nav)
  //   2. route.params.group      (from QR deep link — URL param `group=`)
  // groupLabel is only carried in-app; QR scans don't have it. When
  // missing, the header falls back to the default "Products" title.
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

  // Manufacturer priority — loaded from AsyncStorage on mount.
  // Array of manufacturer names in order; first = highest priority.
  const [mfgPriority, setMfgPriority] = useState<string[]>([]);

  // Load saved priority once on mount.
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(MFG_PRIORITY_KEY)
      .then(raw => {
        if (cancelled || !raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            // Filter out manufacturers no longer in our fixed list (data drift).
            setMfgPriority(parsed.filter(m => ALL_MANUFACTURERS.includes(m)));
          }
        } catch {
          // ignore corrupt storage
        }
      });
    return () => { cancelled = true; };
  }, []);

  // Save when user applies new priority. Fire-and-forget — UI doesn't wait.
  const handleApplyMfgPriority = (next: string[]) => {
    setMfgPriority(next);
    AsyncStorage.setItem(MFG_PRIORITY_KEY, JSON.stringify(next)).catch(() => { });
  };

  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(false);

  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Scroll-to-top FAB state. The button is rendered absolutely over the
  // list and fades in once the user has scrolled past SCROLL_TOP_THRESHOLD.
  const listRef = useRef<FlatList>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const onListScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const shouldShow = y > SCROLL_TOP_THRESHOLD;
    // Guard against same-value re-renders.
    setShowScrollTop(prev => (prev === shouldShow ? prev : shouldShow));
  }, []);

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const totalSelected = Object.values(selections).reduce(
    (s, a) => s + a.length,
    0,
  );

  // Build the URL the QR code will encode. Both pathology filters AND
  // the active group go in — when the same QR is later scanned, the
  // backend resolves the group standalone (no need for the pathology
  // selection to trigger a protocol for the group to apply).
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

  // Sort products by manufacturer priority. Prioritized manufacturers come
  // first in their saved order; everything else keeps its original order
  // afterward. Stable sort behaviour.
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

    // Deep link entry — replace with SolarFilter, pass raw params so
    // SolarFilter's deep-link effect fills the state without a full reset.
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

  const handleOpenDetail = async (item: ProductListItem) => {
    setDetailLoading(true);
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
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.topRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>Étape 2</Text>
              <Text style={styles.title}>
                {groupLabel ?? "Dispositifs\nMédicaux"}
              </Text>
            </View>

            <View style={styles.rightGroup}>
              <View style={styles.rightButtons}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => setMfgModalOpen(true)}
                  activeOpacity={0.85}
                  disabled={totalSelected === 0}
                >
                  <MaterialCommunityIcons
                    name={mfgPriority.length > 0 ? "tag-arrow-down" : "tag-arrow-down-outline"}
                    size={20}
                    color={mfgPriority.length > 0 ? Colors.success : palette.textSecondary}
                  />
                  <Text
                    style={[styles.actionBtnText, { color: mfgPriority.length > 0 ? Colors.success : palette.textSecondary }]}
                  >
                    Labos
                  </Text>
                </TouchableOpacity>

                <View style={styles.headerDivider} />
                <TouchableOpacity
                  style={[styles.actionBtn, totalSelected === 0 && styles.actionBtnDisabled]}
                  onPress={() => totalSelected >= 0 && setShareOpen(true)}
                  activeOpacity={0.85}
                  disabled={totalSelected === 0}
                >
                  <Ionicons
                    name="qr-code-outline"
                    size={20}
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

        <View style={styles.bodyContainer}>
          {/* Body */}
          {listLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={palette.fabBg} />
            </View>
          ) : listError ? (
            <View style={styles.empty}>
              <Ionicons name="cloud-offline-outline" size={40} color={palette.textMuted} />
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
              <Ionicons name="search-outline" size={50} color={palette.textMuted} />
              <Text style={styles.emptyTitle}>Aucun dispositif trouvé.</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={handleBack}
                activeOpacity={0.85}
              >
                <Text style={styles.emptyBtnText}>Retour aux critères patient</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={sortedProducts}
              keyExtractor={p => p.id}
              renderItem={({ item }) => (
                <ProductCard
                  product={listItemToCardProduct(item)}
                  onPress={() => handleOpenDetail(item)}
                />
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              onScroll={onListScroll}
              scrollEventThrottle={64}
            />
          )}

          <View style={styles.floatBar} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.cta}
              onPress={handleBack}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-back" size={22} color='#fff' />
              <Text style={styles.ctaText}>Retour aux critères patient</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Scroll-to-top FAB. Rendered last inside the SafeAreaView so it
            floats above the FlatList and respects bottom safe-area inset.
            Visibility is driven by onListScroll; we don't animate the
            mount/unmount to keep things light. */}
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

        {detailLoading && (
          <View style={styles.detailLoader} pointerEvents="none">
            <ActivityIndicator size="small" color="#FFFFFF" />
          </View>
        )}
      </SafeAreaView>

      <ProductDetailModal
        visible={!!detailProduct}
        product={detailProduct}
        userFilters={userFilters}
        onClose={() => setDetailProduct(null)}
      />

      <ShareQrModal
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        url={shareUrl}
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
  bodyContainer: { flex: 1, backgroundColor: palette.bg },

  topBar: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 16,
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
  eyebrow: {
    fontSize: 12,
    fontFamily: 'Roboto',
    fontWeight: '600',
    letterSpacing: 1.2,
    color: palette.textMuted,
    textTransform: 'uppercase',
    marginBottom: 7,
  },
  title: {
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: 0.3,
    fontFamily: 'Poppins-Bold',
    color: palette.textPrimary,
    width: '80%',
  },
  bannerText: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: palette.textSecondary,
    marginTop: 1,
  },

  // Thin vertical line separating the left title block from the
  // right-side action group. Stretches to topRow's height via alignSelf.
  topVerticalDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: palette.border,
    marginLeft: 10,
  },

  // Right-side grouped actions (label + two icon+text buttons)
  rightGroup: {
    alignItems: 'flex-end',
  },
  rightButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDisabled: {
    opacity: 0.45,
  },
  actionBtnText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: palette.textPrimary,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  headerDivider: {
    width: 1,
    backgroundColor: palette.border,
    marginVertical: 6,
  },

  // Secondary filter pills (row 2)
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
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
    color: palette.textSecondary,
    marginTop: 14,
  },
  emptySub: {
    fontSize: 16,
    fontFamily: 'Roboto',
    fontWeight: '400',
    color: palette.textMuted,
    textAlign: 'center',
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
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },

  // Loading indicator shown while a product detail is being fetched.
  // Floats at the bottom-center so the scroll-to-top FAB can own the
  // bottom-right corner. Centering trick: left:'50%' plus a negative
  // marginLeft equal to half the width.
  detailLoader: {
    position: 'absolute',
    bottom: 130,
    left: '50%',
    marginLeft: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll-to-top FAB. Sits in the bottom-right corner — formerly the
  // detail-loader's spot. The two no longer overlap because the loader
  // moved to bottom-center.
  scrollTopBtn: {
    position: 'absolute',
    bottom: 122,
    right: 22,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
    opacity: 0.8
  },

  // Floats over the scrolling body instead of sitting in a footer.
  floatBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  cta: {
    flex: 1,
    flexDirection:'row',
    gap: 6,
    backgroundColor: palette.textPrimary,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 7,
    opacity: 0.9,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 0.3,
  },
});