import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
// React Navigation linking config should match this prefix.
const SHARE_URL_BASE = 'https://orthomastaer.fr/products';

// Fixed list of manufacturers. Adjust to match your real lookup table.
const ALL_MANUFACTURERS: string[] = [
  'Thuasne',
  'Donjoy',
  'Gibaud',
  'Sidas',
  'Bauerfeind',
  'Medi',
  'BSN Medical',
  'Orliman',
];

// AsyncStorage key for the saved priority order.
const MFG_PRIORITY_KEY = '@orthomaster/manufacturer_priority';

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
    manufacturer: d.manufacturer ?? '',
    category: d.category,
    images: d.images,
    tags: d.tags,
    description_tabs: d.description_tabs,
    sizes: d.sizes,
    sub: d.sub
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

  const [summaryOpen, setSummaryOpen] = useState(false);
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

  const totalSelected = Object.values(selections).reduce(
    (s, a) => s + a.length,
    0,
  );

  // Build the URL the QR code will encode. Only pathology filters go in.
  const flatFilters = useMemo(() => flattenSelections(selections), [selections]);
  const userFilters = useMemo(() => new Set(flatFilters), [flatFilters]);
  const shareUrl = useMemo(
    () =>
      flatFilters.length === 0
        ? SHARE_URL_BASE
        : `${SHARE_URL_BASE}?filters=${encodeURIComponent(flatFilters.join(','))}`,
    [flatFilters],
  );

  const fetchSeqRef = useRef(0);
  const fetchList = () => {
    const mySeq = ++fetchSeqRef.current;
    setListLoading(true);
    setListError(false);

    filterProducts(flatFilters)
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
  }, [selections]);

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

  const onBack = () => navigation.goBack();

  const handleResetFilters = () => {
    setSummaryOpen(false);
    navigation.navigate('new-que-choisir', { reset: true });
  };

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
          {/* Row 1 — back + title + filter count + share QR */}
          <View style={styles.topRow}>
            <TouchableOpacity
              onPress={onBack}
              style={styles.backBtn}
              hitSlop={10}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color={palette.textPrimary} />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>
                Products
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

            {/* Right side: labeled group with two icon+text actions */}
            <View style={styles.rightGroup}>
              <Text style={styles.rightLabel}>Filtres Patient</Text>
              <View style={styles.rightButtons}>
                <TouchableOpacity
                  style={[styles.actionBtn, totalSelected === 0 && styles.actionBtnDisabled]}
                  onPress={() => setSummaryOpen(true)}
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
                    color={totalSelected === 0 ? palette.textMuted : '#3B82F6'}
                  />
                  <Text
                    style={[
                      styles.actionBtnText,
                      { color: totalSelected === 0 ? palette.textMuted : '#3B82F6' },
                    ]}
                  >
                    Partager
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Row 2 — secondary filter pills (manufacturer, country) */}
        <View style={styles.pillsRow}>
          {/* Fabricant — active when at least one is in priority */}
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
              onPress={onBack}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyBtnText}>Retour aux filtres</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
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
          />
        )}

        {detailLoading && (
          <View style={styles.detailLoader} pointerEvents="none">
            <ActivityIndicator size="small" color="#FFFFFF" />
          </View>
        )}
      </SafeAreaView>

      {/* Modals */}
      <FilterSummaryModal
        visible={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        onReset={handleResetFilters}
        nodes={SAMPLE_NODES}
        selections={selections}
      />

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
  root: { flex: 1, backgroundColor: palette.bg },

  topBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
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
    fontSize: 17,
    fontWeight: '700',
    color: palette.textPrimary,
    letterSpacing: -0.3,
  },
  bannerText: {
    fontSize: 12,
    color: palette.textSecondary,
    marginTop: 1,
  },

  // Right-side grouped actions (label + two icon+text buttons)
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
    fontFamily: 'Poppins-Regular',
    marginTop: 0,
    letterSpacing: 0.2
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

  detailLoader: {
    position: 'absolute',
    bottom: 22,
    right: 22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});