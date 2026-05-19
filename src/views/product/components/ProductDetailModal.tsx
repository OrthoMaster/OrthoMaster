import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Product, ProductSizeDimension, ProductSizeOption } from '../lib/Products';
import { palette } from '../lib/Theme';

type ProductDetailModalProps = {
  visible: boolean;
  product: Product | null;
  // Flat set of childIds the user has selected (from pathology filters).
  // Used to highlight size rows whose filter_keys match.
  userFilters?: Set<string>;
  onClose: () => void;
};

// Internal tab shape — discriminated union so we can render markdown or
// the structured sizes table from one tabs array.
type TabItem =
  | { kind: 'markdown'; title: string; content: string }
  | { kind: 'sizes';    title: string; dimensions: ProductSizeDimension[] };

export function ProductDetailModal({
  visible, product, userFilters, onClose,
}: ProductDetailModalProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  const MODAL_H = screenHeight * 0.9;
  const IMAGE_H = screenWidth;
  const TITLE_H = 250;
  const TABS_H  = 50;
  const TAB_CONTENT_H = MODAL_H - TITLE_H - TABS_H;

  useEffect(() => {
    if (visible) {
      setActiveTab(0);
      setImageIndex(0);
    }
  }, [visible, product?.id]);

  // Build the unified tab list.
  //   - "Tailles" tab FIRST if the product has at least one valid dimension.
  //     If sizes is null/empty, the tab is omitted entirely.
  //   - Description tabs from admin markdown after (filtered for empties).
  const tabs: TabItem[] = useMemo(() => {
    const out: TabItem[] = [];

    const dims = (product?.sizes?.dimensions ?? [])
      .filter(d => (d.name ?? '').trim() !== '' && (d.options?.length ?? 0) > 0);
    if (dims.length > 0) {
      out.push({ kind: 'sizes', title: 'Tailles', dimensions: dims });
    }

    const desc = product?.description_tabs ?? [];
    desc.forEach(t => {
      const title = t.title?.trim() ?? '';
      const content = t.content_markdown ?? '';
      if (title === '' && content.trim() === '') return;
      out.push({ kind: 'markdown', title: title || 'Tab', content });
    });

    return out;
  }, [product]);

  if (!product) return <Modal visible={false} transparent />;

  const onImageScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const idx = Math.round(offsetX / screenWidth);
    if (idx !== imageIndex) setImageIndex(idx);
  };

  const current = tabs[activeTab];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { height: MODAL_H }]}>
          <ScrollView
            style={{ flex: 1 }}
            stickyHeaderIndices={[1, 2]}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* [0] Image carousel */}
            <View style={{ width: screenWidth, height: IMAGE_H }}>
              <FlatList
                data={product.images}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onImageScroll}
                scrollEventThrottle={32}
                keyExtractor={(_, i) => `img-${i}`}
                renderItem={({ item }) => (
                  <Image
                    source={{ uri: item }}
                    style={{ width: screenWidth, height: IMAGE_H }}
                    resizeMode="cover"
                  />
                )}
              />

              {product.images.length > 1 && (
                <View style={styles.counter}>
                  <Text style={styles.counterText}>
                    {imageIndex + 1}/{product.images.length}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                hitSlop={10}
                activeOpacity={0.85}
              >
                <Ionicons name="close" size={22} color={palette.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* [1] Title strip — STICKY */}
            <View style={styles.titleStrip}>
              <Text style={styles.manufacturer}>{product.manufacturer}</Text>
              <Text style={styles.name} numberOfLines={2}>
                {product.name}
              </Text>
              <Text style={styles.category}>{product.category}</Text>
            </View>

            {/* [2] Tabs bar — STICKY */}
            <View style={styles.tabsBar}>
              {tabs.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tabsRow}
                >
                  {tabs.map((t, i) => {
                    const active = activeTab === i;
                    return (
                      <Pressable
                        key={`${t.title}-${i}`}
                        onPress={() => setActiveTab(i)}
                        style={[styles.tab, active && styles.tabActive]}
                      >
                        <Text
                          style={[styles.tabText, active && styles.tabTextActive]}
                          numberOfLines={1}
                        >
                          {t.title}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : (
                <View style={{ height: TABS_H }} />
              )}
            </View>

            {/* [3] Tab content */}
            <View style={{ height: TAB_CONTENT_H }}>
              {tabs.length === 0 ? (
                <View style={styles.placeholderBox}>
                  <Ionicons
                    name="document-text-outline"
                    size={28}
                    color={palette.textMuted}
                  />
                  <Text style={styles.placeholderText}>No details available</Text>
                  <Text style={styles.placeholderSub}>
                    This product has no description tabs yet.
                  </Text>
                </View>
              ) : current?.kind === 'sizes' ? (
                <SizesTabContent dimensions={current.dimensions} userFilters={userFilters} />
              ) : (
                <ScrollView
                  key={activeTab}
                  style={{ flex: 1 }}
                  contentContainerStyle={styles.tabBody}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  <Text style={styles.tabBodyText}>
                    {current?.kind === 'markdown' ? current.content : ''}
                  </Text>
                </ScrollView>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ===============================================================
// Sizes tab content — multiple dimension sections, one recommended
// per section (match-per-dimension semantics).
// ===============================================================

function SizesTabContent({
  dimensions, userFilters,
}: {
  dimensions: ProductSizeDimension[];
  userFilters?: Set<string>;
}) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.sizesBody}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      {dimensions.map((dim, di) => (
        <DimensionSection
          key={`${dim.name}-${di}`}
          dimension={dim}
          userFilters={userFilters}
        />
      ))}
    </ScrollView>
  );
}

// Match logic for a single option against user filters.
// Returns { matched, displayRange }:
//   - matched: any path (variants OR flat keys) hit
//   - displayRange: variant-specific range when a variant matched,
//     otherwise the option's top-level range.
function matchOption(
  opt: ProductSizeOption,
  userFilters?: Set<string>,
): { matched: boolean; displayRange: string } {
  const filters = userFilters ?? new Set<string>();
  const fallbackRange = opt.range ?? '';

  if (opt.variants && opt.variants.length > 0) {
    for (const v of opt.variants) {
      if (v.filter_keys.length === 0) continue;
      const ok = v.filter_keys.every(k => filters.has(k));
      if (ok) {
        return { matched: true, displayRange: v.range ?? fallbackRange };
      }
    }
    // No variant matched. If there are ALSO flat filter_keys, fall through
    // and check them — variants are additive, not exclusive.
  }

  if (opt.filter_keys && opt.filter_keys.length > 0) {
    const ok = opt.filter_keys.every(k => filters.has(k));
    return { matched: ok, displayRange: fallbackRange };
  }

  return { matched: false, displayRange: fallbackRange };
}

function DimensionSection({
  dimension, userFilters,
}: {
  dimension: ProductSizeDimension;
  userFilters?: Set<string>;
}) {
  // Pre-compute match status + display range for every option in this
  // dimension. Done once per render so the row map doesn't redo work.
  const rows = useMemo(
    () => dimension.options.map(o => ({ opt: o, ...matchOption(o, userFilters) })),
    [dimension.options, userFilters],
  );
  const anyMatched = rows.some(r => r.matched);

  return (
    <View style={styles.dimensionSection}>
      <View style={styles.dimensionHeader}>
        <Text style={styles.dimensionTitle}>{dimension.name}</Text>
        {anyMatched && (
          <View style={styles.dimensionBadge}>
            <Ionicons name="checkmark" size={11} color="#1D4ED8" style={{ marginRight: 3 }} />
            <Text style={styles.dimensionBadgeText}>Suggestion</Text>
          </View>
        )}
      </View>

      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, { flex: 1 }]}>Taille</Text>
        <Text style={[styles.headerCell, { flex: 2 }]}>Mesure</Text>
        <View style={{ width: 110 }} />
      </View>

      {rows.map(({ opt, matched, displayRange }, i) => (
        <View
          key={`${opt.label}-${i}`}
          style={[styles.row, matched && styles.rowHighlight]}
        >
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            {matched && (
              <Ionicons
                name="checkmark-circle"
                size={18}
                color="#3B82F6"
                style={{ marginRight: 6 }}
              />
            )}
            <Text style={[styles.labelText, matched && styles.labelTextHighlight]}>
              {opt.label}
            </Text>
          </View>

          <Text
            style={[styles.rangeText, matched && styles.rangeTextHighlight, { flex: 2 }]}
            numberOfLines={1}
          >
            {displayRange || '—'}
          </Text>

          <View style={{ width: 110, alignItems: 'flex-end' }}>
            {matched && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Recommandée</Text>
              </View>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: palette.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  counter: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 999,
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  titleStrip: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: palette.cardBg,
  },
  manufacturer: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.textMuted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.textPrimary,
    letterSpacing: -0.3,
    marginTop: 4,
    lineHeight: 22,
  },
  category: {
    fontSize: 12,
    fontWeight: '500',
    color: palette.textSecondary,
    marginTop: 4,
  },

  tabsBar: {
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: palette.cardBg,
  },
  tabsRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.bg,
    maxWidth: 180,
  },
  tabActive: {
    backgroundColor: palette.fabBg,
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  tabBody: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },
  tabBodyText: {
    fontSize: 14,
    lineHeight: 21,
    color: palette.textPrimary,
  },

  // Sizes tab
  sizesBody: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },
  dimensionSection: {
    marginBottom: 22,
  },
  dimensionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  dimensionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textPrimary,
    letterSpacing: -0.2,
  },
  dimensionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  dimensionBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1D4ED8',
    letterSpacing: 0.2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  headerCell: {
    fontSize: 10.5,
    fontWeight: '700',
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: palette.bg,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 6,
  },
  rowHighlight: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
    borderWidth: 1.5,
  },
  labelText: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  labelTextHighlight: {
    color: '#1D4ED8',
  },
  rangeText: {
    fontSize: 13,
    color: palette.textSecondary,
  },
  rangeTextHighlight: {
    color: '#1D4ED8',
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#3B82F6',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  placeholderBox: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    margin: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textSecondary,
    marginTop: 10,
  },
  placeholderSub: {
    fontSize: 12,
    color: palette.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
    textAlign: 'center',
  },
});