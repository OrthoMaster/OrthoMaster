import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';

import { ManufacturerPriorityModal } from './components/ManufacturerPriorityModal';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ShareQrModal } from './components/ShareQrModal';

import { MainNode, Selections } from './lib/Logic';
import { Product } from './lib/Products';
import { SAMPLE_NODES } from './lib/SampleRules';
import { palette } from './lib/Theme';
import Colors from '../../../constants/Colors';

import {
  filterProducts,
  getProduct,
  ProductDetail,
  ProductListItem,
} from '../../services/v2/ProductService';

// ============================================================
// Web sibling of ProductsScreen.tsx.
//
// Above 1024px the screen splits: the list keeps the left column and the
// product sheet moves into a permanent right column, so comparing two
// devices is a click each instead of open-read-close-open. Below that
// the native single-column flow is kept, detail modal included.
// ============================================================

const BREAKPOINT = 1024;
const FOOTER_MAX = 720;

const clickable = { cursor: 'pointer' } as unknown as ViewStyle;
const smoothTint = {
  transitionProperty: 'background-color, border-color',
  transitionDuration: '150ms',
} as unknown as ViewStyle;

const SHARE_URL_BASE = 'https://go.orthomaster.fr/open/products-view';

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

// AsyncStorage falls back to localStorage on web, so the saved order
// survives reloads per browser profile.
const MFG_PRIORITY_KEY = '@orthomaster/manufacturer_priority';

const SCROLL_TOP_THRESHOLD = 300;

function flattenSelections(selections: Selections): string[] {
  return Object.values(selections).flat();
}

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
    sizes: d.sizes,
  } as Product;
}

export const ProductsScreen = ({ navigation, route }: any) => {
  const { width } = useWindowDimensions();
  const isWide = width >= BREAKPOINT;

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

  // selectedId drives the list highlight, detailProduct the panel. They
  // move together but the id lands first, so the row responds to the
  // click before the request comes back.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

  const totalSelected = Object.values(selections).reduce((s, a) => s + a.length, 0);

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
  const fetchList = useCallback(() => {
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
  }, [flatFilters, groupId]);

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selections, groupId]);

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

  // A new list means the open sheet may no longer be in it.
  useEffect(() => {
    if (!selectedId) return;
    if (products.some(p => p.id === selectedId)) return;
    setSelectedId(null);
    setDetailProduct(null);
  }, [products, selectedId]);

  const handleBack = useCallback(() => {
    const state = navigation.getState();
    const hasSolarFilterInStack = state.routes.some((r: any) => r.name === 'new-que-choisir');

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

  // Clicking down the list quickly used to let a slow response overwrite
  // a newer one; the sequence guard keeps the panel on the last click.
  const detailSeqRef = useRef(0);
  const handleOpenDetail = useCallback(async (item: ProductListItem) => {
    const mySeq = ++detailSeqRef.current;
    setSelectedId(item.id);
    setDetailLoading(true);

    const detail = await getProduct(item.id);
    if (mySeq !== detailSeqRef.current) return;

    setDetailLoading(false);
    setDetailProduct(detail ? detailToModalProduct(detail) : listItemToCardProduct(item));
  }, []);

  const closeDetail = useCallback(() => {
    detailSeqRef.current++;
    setSelectedId(null);
    setDetailProduct(null);
    setDetailLoading(false);
  }, []);

  // ---------- pieces shared by both layouts ----------

  const topBar = (
    <View style={[styles.topBar, isWide && styles.topBarWide]}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Étape 2</Text>
          <Text style={[styles.title, isWide && styles.titleWide]}>
            {groupLabel ?? (isWide ? 'Dispositifs médicaux' : 'Dispositifs\nMédicaux')}
          </Text>
        </View>

        <View style={styles.rightButtons}>
          <Pressable
            style={[styles.actionBtn, clickable, smoothTint]}
            onPress={() => setMfgModalOpen(true)}
            disabled={totalSelected === 0}
          >
            <MaterialCommunityIcons
              name={mfgPriority.length > 0 ? 'tag-arrow-down' : 'tag-arrow-down-outline'}
              size={20}
              color={mfgPriority.length > 0 ? Colors.success : palette.textSecondary}
            />
            <Text
              style={[
                styles.actionBtnText,
                { color: mfgPriority.length > 0 ? Colors.success : palette.textSecondary },
              ]}
            >
              Labos
            </Text>
          </Pressable>

          <View style={styles.headerDivider} />

          <Pressable
            style={[
              styles.actionBtn,
              totalSelected === 0 && styles.actionBtnDisabled,
              clickable,
              smoothTint,
            ]}
            onPress={() => setShareOpen(true)}
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
          </Pressable>
        </View>
      </View>
    </View>
  );

  const listBody = listLoading ? (
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
      <Pressable style={[styles.emptyBtn, clickable]} onPress={fetchList}>
        <Text style={styles.emptyBtnText}>Veuillez réessayer</Text>
      </Pressable>
    </View>
  ) : products.length === 0 ? (
    <View style={styles.empty}>
      <Ionicons name="search-outline" size={50} color={palette.textMuted} />
      <Text style={styles.emptyTitle}>Aucun dispositif trouvé.</Text>
      <Pressable style={[styles.emptyBtn, clickable]} onPress={handleBack}>
        <Text style={styles.emptyBtnText}>Retour aux critères patient</Text>
      </Pressable>
    </View>
  ) : (
    <FlatList
      // numColumns can't change on a mounted list, so the key forces a
      // remount when the layout flips.
      key={isWide ? 'grid-2' : 'grid-1'}
      ref={listRef}
      data={sortedProducts}
      keyExtractor={p => p.id}
      numColumns={isWide ? 2 : 1}
      columnWrapperStyle={isWide ? styles.columnWrapper : undefined}
      renderItem={({ item }) => (
        <View style={styles.cardCell}>
          <ProductCard
            product={listItemToCardProduct(item)}
            onPress={() => handleOpenDetail(item)}
            {...({ selected: isWide && item.id === selectedId } as any)}
          />
        </View>
      )}
      extraData={selectedId}
      contentContainerStyle={[styles.listContent, isWide && styles.listContentWide]}
      showsVerticalScrollIndicator={true}
      onScroll={onListScroll}
      scrollEventThrottle={64}
    />
  );

  const scrollTopFab = showScrollTop ? (
    <Pressable
      style={[styles.scrollTopBtn, isWide && styles.scrollTopBtnWide, clickable]}
      onPress={scrollToTop}
      accessibilityLabel="Remonter en haut"
    >
      <Ionicons name="arrow-up" size={22} color="#FFFFFF" />
    </Pressable>
  ) : null;

  const backCta = (
    <Pressable style={[styles.cta, clickable]} onPress={handleBack}>
      <Ionicons name="arrow-back" size={20} color="#fff" />
      <Text style={styles.ctaText}>Retour aux critères patient</Text>
    </Pressable>
  );

  // ---------- detail column ----------

  const detailColumn = (
    <View style={styles.detailCol}>
      <ProductDetailModal
        embedded
        visible={!!detailProduct}
        product={detailProduct}
        userFilters={userFilters}
        onClose={closeDetail}
      />

      {detailLoading && (
        <View style={styles.detailOverlay} pointerEvents="none">
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      )}
    </View>
  );

  // ---------- render ----------

  return (
    <View style={styles.root}>
      {isWide ? (
        <View style={styles.splitBody}>
          {/* Top bar belongs to the list column, so the detail column runs
              the full height of the window. */}
          <View style={styles.listCol}>
            {topBar}
            <View style={styles.listArea}>
              {listBody}
              {scrollTopFab}
            </View>
            <View style={styles.footer}>
              <View style={styles.footerInner}>{backCta}</View>
            </View>
          </View>

          {detailColumn}
        </View>
      ) : (
        <>
          {topBar}
          <View style={styles.bodyContainer}>
            {listBody}

            <View style={styles.floatBar} pointerEvents="box-none">
              {backCta}
            </View>

            {scrollTopFab}

            {detailLoading && !detailProduct && (
              <View style={styles.detailLoader} pointerEvents="none">
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
          </View>
        </>
      )}

      {/* Narrow only — on wide the same content lives in the right column. */}
      <ProductDetailModal
        visible={!isWide && !!detailProduct}
        product={detailProduct}
        userFilters={userFilters}
        onClose={closeDetail}
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

  // ---- top bar ----
  topBar: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: palette.cardBg,
    zIndex: 10,
  },
  topBarWide: { paddingHorizontal: 28 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eyebrow: {
    fontSize: 15,
    fontFamily: 'Roboto',
    fontWeight: '400',
    letterSpacing: 1.2,
    color: palette.textMuted,
  },
  title: {
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: 0.3,
    fontFamily: 'Poppins-Bold',
    color: palette.textPrimary,
    width: '80%',
  },
  titleWide: { fontSize: 24, lineHeight: 28, width: 'auto' },
  rightButtons: { flexDirection: 'row', alignItems: 'stretch', gap: 12 },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnDisabled: { opacity: 0.45 },
  actionBtnText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: palette.textPrimary,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  headerDivider: { width: 1, backgroundColor: palette.border, marginVertical: 6 },

  // ---- wide split ----
  // Proportions and box model taken from the old working version: two
  // flex columns with flexBasis 0, nothing else. No fixed width, no
  // explicit heights — the panel's flex:1 root resolves against these.
  splitBody: { flex: 1, flexDirection: 'row' },
  listCol: {
    flex: 6,
    flexBasis: 0,
    borderRightWidth: 1,
    borderRightColor: palette.border,
  },
  listArea: { flex: 1 },
  detailCol: {
    flex: 4,
    flexBasis: 0,
    backgroundColor: palette.cardBg,
  },
  detailOverlay: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
    backgroundColor: palette.cardBg,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  footerInner: {
    width: '100%',
    maxWidth: FOOTER_MAX,
    flexDirection: 'row',
    alignItems: 'center',
  },

  // ---- narrow ----
  bodyContainer: { flex: 1, backgroundColor: palette.bg },
  floatBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 640,
    gap: 9,
  },

  // ---- list ----
  listContent: { paddingHorizontal: 14, paddingVertical: 14, paddingBottom: 120 },
  listContentWide: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    paddingBottom: 24,
  },
  // Gap between the two columns; matched to cardCell's marginBottom so
  // horizontal and vertical spacing read the same.
  columnWrapper: { gap: 14 },
  // Layout only — the selected look lives inside ProductCard.
  cardCell: {
    flex: 1,
    marginBottom: 14,
  },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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

  detailLoader: {
    position: 'absolute',
    bottom: 110,
    left: '50%',
    marginLeft: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollTopBtn: {
    position: 'absolute',
    bottom: 110,
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
    opacity: 0.85,
  },
  // No floating CTA to clear in the split layout — the footer holds it.
  scrollTopBtnWide: { bottom: 22, right: 26 },

  cta: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: palette.textPrimary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 0.3,
  },
});