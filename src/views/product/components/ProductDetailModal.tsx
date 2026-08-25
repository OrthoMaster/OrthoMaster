import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Linking,
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
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PinchGestureHandler,
  State,
} from 'react-native-gesture-handler';
import { SvgUri, SvgXml } from 'react-native-svg';
import { MainNode } from '../lib/Logic';
import { Product, ProductSizeOption } from '../lib/Products';
import { palette } from '../lib/Theme';
import { getRules } from '../../../services/v2/ProductService';

// Cached at module load for use inside StyleSheet.create. Portrait-only
// app so this won't get stale on orientation change; if that ever
// changes, move width into a useWindowDimensions() call inside the
// component instead.
const SCREEN_W = Dimensions.get('window').width;

// Aspect-ratio threshold at which markdown media renders edge-to-edge
// (banner-style). Below this — squares and portraits — media is
// contained and centered so it doesn't stretch into a giant block.
const LANDSCAPE_MIN_RATIO = 1.3;

// Max side length for contained (non-landscape) media. Balances against
// a typical phone width without dominating the tab vertically.
const CONTAINED_MAX = 280;

type ProductDetailModalProps = {
  visible: boolean;
  product: Product | null;
  // Flat set of childIds the user has selected (pathology + measurement
  // buckets combined). Measurement buckets resolve to numeric ranges via
  // the fetched rules tree, used for taille overlap highlighting.
  userFilters?: Set<string>;
  onClose: () => void;
};

// Internal tab shape — discriminated union so we can render markdown or
// the structured sizes table from one tabs array.
type TabItem =
  | { kind: 'markdown'; title: string; content: string }
  | { kind: 'sizes'; title: string; options: ProductSizeOption[] };

// Numeric description of a measurement bucket the user picked.
type ActiveBucket = { dimKey: string; min: number; max: number };

// Per-option / per-measurement match result, computed once per render.
type RowState = {
  opt: ProductSizeOption;
  matched: boolean;                              // option overall
  perDim: Record<string, boolean>;               // dimKey → row highlight
};

export function ProductDetailModal({
  visible, product, userFilters, onClose,
}: ProductDetailModalProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [atTop, setAtTop] = useState(true);

  // Ref cho ScrollView dọc chính — dùng để scroll xuống khi bấm "Voir détails".
  const mainScrollRef = useRef<ScrollView>(null);

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  const MODAL_H = screenHeight * 0.9;
  const IMAGE_H = screenWidth;
  const TITLE_H = 250;
  const TABS_H = 50;
  const TAB_CONTENT_H = MODAL_H - TITLE_H - TABS_H;

  // Fetch rules — shared cache via React Query under a stable key.
  const { data: rules = [] } = useQuery({
    queryKey: ['product-rules'],
    queryFn: () => getRules(),
    retry: 1,
    retryDelay: 1000,
  });

  useEffect(() => {
    if (visible) {
      setActiveTab(0);
      setImageIndex(0);
      setAtTop(true);
      mainScrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [visible, product?.id]);

  // Build the unified tab list.
  //   - "Tailles" tab FIRST if the product has any options.
  //   - Description tabs from admin markdown after (filtered for empties).
  const tabs: TabItem[] = useMemo(() => {
    const out: TabItem[] = [];

    const opts = (product?.sizes?.options ?? [])
      .filter(o => (o.label ?? '').trim() !== '');
    if (opts.length > 0) {
      out.push({ kind: 'sizes', title: 'Tailles', options: opts });
    }

    const desc = product?.description_tabs ?? [];
    desc.forEach(t => {
      const title = t.title?.trim() ?? '';
      const content = t.content ?? '';
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

  // Theo dõi vị trí cuộn dọc của modal: coi là "on top" khi ảnh còn hiện
  // gần như đầy (đã cuộn chưa quá 40px). Dùng để ẩn/hiện nút "Voir détails".
  const onMainScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const next = y < 40;
    if (next !== atTop) setAtTop(next);
  };

  // Cuộn xuống để lộ phần title + tabs + nội dung (qua hết ảnh).
  const scrollToContent = () => {
    mainScrollRef.current?.scrollTo({ y: IMAGE_H, animated: true });
  };

  const current = tabs[activeTab];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { height: MODAL_H }]}>
          <ScrollView
            ref={mainScrollRef}
            style={{ flex: 1 }}
            stickyHeaderIndices={[1, 2]}
            showsVerticalScrollIndicator={false}
            bounces={false}
            onScroll={onMainScroll}
            scrollEventThrottle={16}
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
                    resizeMode="contain"
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
            </View>

            {/* [1] Title strip — STICKY */}
            <View style={styles.titleStrip}>
              <Text style={styles.manufacturer}>{product.manufacturer}</Text>
              <Text style={styles.name} numberOfLines={2}>
                {product.name}
              </Text>
              {/* {!!product.sub && (
                <Text style={styles.sub} numberOfLines={2}>
                  {product.sub}
                </Text>
              )} */}
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
                <SizesTabContent
                  options={current.options}
                  userFilters={userFilters}
                  rules={rules}
                />
              ) : (
                <ScrollView
                  key={activeTab}
                  style={{ flex: 1 }}
                  contentContainerStyle={styles.tabBody}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  <SimpleMarkdown
                    content={current?.kind === 'markdown' ? current.content : ''}
                  />
                </ScrollView>
              )}
            </View>
          </ScrollView>

          {/* Close button — CỐ ĐỊNH góc phải trên của modal, không cuộn theo ảnh */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={10}
            activeOpacity={0.85}
          >
            <Ionicons name="close" size={22} color={palette.textPrimary} />
          </TouchableOpacity>

          {/* "Voir détails" — nổi ở đáy, chỉ hiện khi đang on top */}
          {atTop && (
            <View style={styles.voirWrap} pointerEvents="box-none">
              <TouchableOpacity
                style={styles.voirBtn}
                onPress={scrollToContent}
                activeOpacity={0.9}
              >
                <Text style={styles.voirText}>Voir plus</Text>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color="#FFFFFF"
                  style={{ marginLeft: 6 }}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ===============================================================
// Sizes tab content — flat options with per-option measurements.
// Highlight logic uses range overlap against user-selected buckets.
// ===============================================================

function SizesTabContent({
  options, userFilters, rules,
}: {
  options: ProductSizeOption[];
  userFilters?: Set<string>;
  rules: MainNode[];
}) {
  // Resolve which measurement buckets the user has selected — turns the
  // flat filter set into a list of {dimKey, min, max} we can overlap-test.
  const activeBuckets = useMemo(
    () => resolveActiveBuckets(userFilters, rules),
    [userFilters, rules],
  );

  // Dimension title map — dimKey → node title from rules.json. Used to
  // label each measurement row on an option. Rebuilds only when rules
  // change (which is rare — cached via React Query).
  const dimTitleMap = useMemo(() => buildDimTitleMap(rules), [rules]);

  // Per-option highlight state. An option is "matched" when:
  //   - The user has at least one active measurement bucket, AND
  //   - For EVERY active bucket dimension, the option has a measurement
  //     for that dimension, AND its range overlaps the bucket range.
  // (Option that doesn't declare a dimension the user filtered on can't
  // be promised to fit → not highlighted.)
  const rows: RowState[] = useMemo(() => {
    return options.map(opt => computeRowState(opt, activeBuckets));
  }, [options, activeBuckets]);

  const anyMatched = rows.some(r => r.matched);
  const hasActive = activeBuckets.length > 0;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.sizesBody}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tailles disponibles</Text>
        {anyMatched && (
          <View style={styles.sectionBadge}>
            <Ionicons name="checkmark" size={11} color="#1D4ED8" style={{ marginRight: 3 }} />
            <Text style={styles.sectionBadgeText}>Suggestion</Text>
          </View>
        )}
      </View>

      <SizesTable rows={rows} dimTitleMap={dimTitleMap} />
    </ScrollView>
  );
}

// ===============================================================
// SizesTable — table layout instead of per-option cards.
//   Layout: fixed "Taille" column on the left + horizontally
//   scrollable data columns on the right. Row highlighting (matched)
//   applies on both sides at once so a highlighted row stays aligned
//   when the user scrolls the data columns.
// ===============================================================
function SizesTable({
  rows, dimTitleMap,
}: {
  rows: RowState[];
  dimTitleMap: Map<string, string>;
}) {
  // Union of every measurement key across all options — one column per
  // dim. Preserve first-appearance order so the layout is stable and
  // predictable rather than alphabetised.
  const dimColumns = useMemo(() => {
    const seen = new Set<string>();
    const order: string[] = [];
    for (const row of rows) {
      for (const k of Object.keys(row.opt.measurements || {})) {
        if (!seen.has(k)) {
          seen.add(k);
          order.push(k);
        }
      }
    }
    return order;
  }, [rows]);

  // Measure the horizontal ScrollView's visible width so we can decide
  // whether to stretch the data columns (few dims → fill the area) or
  // keep them at their min width and let the user scroll (many dims →
  // overflow). Set once on layout; recomputed on orientation changes.
  const [scrollAreaWidth, setScrollAreaWidth] = useState(0);

  const DATA_COL_MIN = 120;
  const numCols = dimColumns.length;
  const naturalWidth = numCols * DATA_COL_MIN;
  const dataColWidth =
    numCols > 0 && scrollAreaWidth > 0 && naturalWidth < scrollAreaWidth
      ? Math.floor(scrollAreaWidth / numCols)
      : DATA_COL_MIN;

  return (
    <View style={styles.sizesTable}>
      {/* Left: fixed Taille column. Not inside the horizontal ScrollView
          so it stays visible while the user scrolls the data columns. */}
      <View style={styles.sizesFixedCol}>
        {/* Header */}
        <View style={[styles.sizesTableRow, styles.sizesTableHeaderRow]}>
          <View style={[styles.sizesCell, styles.sizesTailleCol]}>
            <Text style={styles.sizesHeaderText} numberOfLines={1}>Taille</Text>
          </View>
        </View>
        {/* Body */}
        {rows.map((row, ri) => {
          const matched = row.matched;
          const isLastRow = ri === rows.length - 1;
          return (
            <View
              key={`${row.opt.label}-${ri}`}
              style={[
                styles.sizesTableRow,
                matched && styles.sizesTableRowMatched,
                !isLastRow && styles.sizesRowBorder,
              ]}
            >
              {/* Body Taille cell — centered (inherits justifyContent
                  from sizesCell). Icon + label appear as a group in
                  the middle of the cell. */}
              <View style={[styles.sizesCell, styles.sizesTailleCol]}>
                {matched && (
                  <Ionicons
                    name="checkmark-circle"
                    size={13}
                    color="#3B82F6"
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text
                  style={[styles.sizesTailleText, matched && styles.sizesTailleTextMatched]}
                  numberOfLines={1}
                >
                  {row.opt.label}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Right: horizontally scrollable data columns. flex:1 makes the
          ScrollView take the remaining outer width; onLayout captures
          it so we can size the data columns to match. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        style={{ flex: 1 }}
        onLayout={(e) => setScrollAreaWidth(e.nativeEvent.layout.width)}
      >
        <View>
          {/* Header row */}
          <View style={[styles.sizesTableRow, styles.sizesTableHeaderRow]}>
            {dimColumns.map((dk, ci) => {
              const isLast = ci === dimColumns.length - 1;
              return (
                <View
                  key={dk}
                  style={[
                    styles.sizesCell,
                    { width: dataColWidth },
                    !isLast && styles.sizesCellBorder,
                  ]}
                >
                  <Text style={styles.sizesHeaderText} numberOfLines={2}>
                    {dimTitleMap.get(dk) || humanizeDimKey(dk)}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Body rows */}
          {rows.map((row, ri) => {
            const matched = row.matched;
            const isLastRow = ri === rows.length - 1;
            return (
              <View
                key={`${row.opt.label}-${ri}`}
                style={[
                  styles.sizesTableRow,
                  matched && styles.sizesTableRowMatched,
                  !isLastRow && styles.sizesRowBorder,
                ]}
              >
                {dimColumns.map((dk, ci) => {
                  const m = row.opt.measurements?.[dk];
                  const isHit = !!row.perDim[dk];
                  const isLast = ci === dimColumns.length - 1;
                  return (
                    <View
                      key={dk}
                      style={[
                        styles.sizesCell,
                        { width: dataColWidth },
                        !isLast && styles.sizesCellBorder,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sizesCellText,
                          isHit && styles.sizesCellTextHit,
                          !m && styles.sizesCellTextMissing,
                        ]}
                        numberOfLines={1}
                      >
                        {m ? (m.displayRange || `${m.min}–${m.max}`) : '—'}
                      </Text>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

// ===============================================================
// SimpleMarkdown — parser markdown nhẹ, không phụ thuộc thư viện
// ngoài (tránh kéo Node stdlib như punycode vào RN bundle).
// Hỗ trợ:
//   - # / ## / ### heading
//   - danh sách (- hoặc *)
//   - inline **bold** / *italic*
//   - table  | a | b |  với dòng phân cách | --- |
//   - [text](url) → link, bấm mở ngoài (mọi url)
//   - [](url) text rỗng + url ảnh   → hiển thị ảnh inline
//   - [](url) text rỗng + url .svg  → render bằng react-native-svg (SvgUri)
//   - [](url) text rỗng + url youtube → thumbnail, bấm mở ngoài
//   - [](url) text rỗng + url khác  → coi như link mở ngoài
//   - khối <svg>...</svg> thô        → render bằng react-native-svg (SvgXml)
// ===============================================================

// ---- Inline segments (bold / italic / link) ----
type Seg =
  | { kind: 'text'; text: string; bold?: boolean; italic?: boolean }
  | { kind: 'link'; text: string; url: string };

// Mở url ra ngoài (web browser / app tương ứng của hệ điều hành).
function openExternal(url: string) {
  Linking.openURL(url).catch(() => { });
}

// URL trỏ tới file .svg — tách riêng để render bằng react-native-svg thay
// vì <Image> (RN Image không vẽ được .svg).
function isSvgUrl(url: string): boolean {
  return /\.svg(\?.*)?$/i.test(url.trim());
}

// URL ảnh raster thông thường — CHÚ Ý: không gồm 'svg' nữa, svg đi nhánh riêng.
function isImageUrl(url: string): boolean {
  return /\.(png|jpe?g|gif|webp|bmp)(\?.*)?$/i.test(url.trim());
}

function isYoutubeUrl(url: string): boolean {
  return /(?:youtube\.com\/|youtu\.be\/)/i.test(url.trim());
}

// Lấy videoId từ các dạng url youtube phổ biến.
function youtubeId(url: string): string | null {
  const u = url.trim();
  const m1 = u.match(/[?&]v=([A-Za-z0-9_-]{6,})/);
  if (m1) return m1[1];
  const m2 = u.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/);
  if (m2) return m2[1];
  const m3 = u.match(/youtube\.com\/(?:embed|shorts)\/([A-Za-z0-9_-]{6,})/);
  if (m3) return m3[1];
  return null;
}

// Parse inline: **bold**, *italic*, [text](url). Trả về list segment.
function parseInline(line: string): Seg[] {
  const segs: Seg[] = [];
  // Tách giữ lại delimiter cho cả link và emphasis.
  const re = /(\[[^\]]*\]\([^)]*\)|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const tokens = line.split(re).filter(t => t !== '');
  for (const tok of tokens) {
    const link = tok.match(/^\[([^\]]*)\]\(([^)]*)\)$/);
    if (link) {
      segs.push({ kind: 'link', text: link[1], url: link[2] });
    } else if (tok.startsWith('**') && tok.endsWith('**') && tok.length >= 4) {
      segs.push({ kind: 'text', text: tok.slice(2, -2), bold: true });
    } else if (tok.startsWith('*') && tok.endsWith('*') && tok.length >= 2) {
      segs.push({ kind: 'text', text: tok.slice(1, -1), italic: true });
    } else {
      segs.push({ kind: 'text', text: tok });
    }
  }
  return segs;
}

function InlineText({ segs, style }: { segs: Seg[]; style?: any }) {
  return (
    <Text style={style}>
      {segs.map((s, i) => {
        if (s.kind === 'link') {
          return (
            <Text key={i} style={styles.mdLink} onPress={() => openExternal(s.url)}>
              {s.text || s.url}
            </Text>
          );
        }
        return (
          <Text
            key={i}
            style={[s.bold && styles.mdBold, s.italic && styles.mdItalic]}
          >
            {s.text}
          </Text>
        );
      })}
    </Text>
  );
}

// ---- Block-level helpers ----

const TABLE_DIVIDER = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

function isTableRow(line: string): boolean {
  return line.trim().startsWith('|') || line.includes('|');
}

// Tách 1 dòng table thành các ô.
function splitTableRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map(c => c.trim());
}

// Một block đứng-riêng = ảnh / svg / youtube (text rỗng, đúng 1 token).
// Trả về 'image' | 'svg' | 'youtube' | null.
function standaloneMedia(
  trimmed: string,
): { type: 'image' | 'svg' | 'youtube'; url: string } | null {
  const m = trimmed.match(/^\[\s*\]\(([^)]*)\)$/);
  if (!m) return null;
  const url = m[1].trim();
  // Kiểm tra .svg TRƯỚC ảnh raster để url .svg không bị nuốt vào nhánh Image.
  if (isSvgUrl(url)) return { type: 'svg', url };
  if (isImageUrl(url)) return { type: 'image', url };
  if (isYoutubeUrl(url)) return { type: 'youtube', url };
  return null;
}

// ===============================================================
// ImageLightbox — full-screen viewer with pinch-to-zoom and pan.
// Uses react-native-gesture-handler (PinchGestureHandler +
// PanGestureHandler in parallel via simultaneousHandlers) plus the
// classic Animated.Value pattern (base * pinch) so the transforms can
// run natively via useNativeDriver.
//
// Zoom is clamped to [1x, 5x]. Pan uses setOffset so translations
// carry across successive drags. Close button + backdrop tap dismiss.
// ===============================================================
function ImageLightbox({ url, visible, onClose }: {
  url: string;
  visible: boolean;
  onClose: () => void;
}) {
  // Scale is (baseScale * pinchScale). baseScale holds the committed
  // zoom between gestures; pinchScale is the live multiplier during
  // one pinch. On gesture end we fold pinchScale into baseScale and
  // reset pinch to 1 so the next gesture starts clean.
  const baseScale = useRef(new Animated.Value(1)).current;
  const pinchScale = useRef(new Animated.Value(1)).current;
  const scale = Animated.multiply(baseScale, pinchScale);
  const lastScale = useRef(1);

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);

  const pinchRef = useRef(null);
  const panRef = useRef(null);

  const onPinchEvent = Animated.event(
    [{ nativeEvent: { scale: pinchScale } }],
    { useNativeDriver: true },
  );

  const onPinchStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const next = lastScale.current * event.nativeEvent.scale;
      const clamped = Math.max(1, Math.min(next, 5));
      lastScale.current = clamped;
      baseScale.setValue(clamped);
      pinchScale.setValue(1);
    }
  };

  const onPanEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true },
  );

  const onPanStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      lastTranslateX.current += event.nativeEvent.translationX;
      lastTranslateY.current += event.nativeEvent.translationY;
      translateX.setOffset(lastTranslateX.current);
      translateY.setOffset(lastTranslateY.current);
      translateX.setValue(0);
      translateY.setValue(0);
    }
  };

  // Reset transforms every time the lightbox closes so re-opening
  // starts back at 1x, centred.
  useEffect(() => {
    if (!visible) {
      lastScale.current = 1;
      baseScale.setValue(1);
      pinchScale.setValue(1);
      lastTranslateX.current = 0;
      lastTranslateY.current = 0;
      translateX.setOffset(0);
      translateY.setOffset(0);
      translateX.setValue(0);
      translateY.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* GestureHandlerRootView is required inside RN Modal — the
          modal renders in a separate root view that gesture-handler
          doesn't auto-instrument on Android. */}
      <GestureHandlerRootView style={styles.lightboxRoot}>
        <View style={styles.lightboxBackdrop}>
          <PanGestureHandler
            ref={panRef}
            simultaneousHandlers={pinchRef}
            onGestureEvent={onPanEvent}
            onHandlerStateChange={onPanStateChange}
          >
            <Animated.View style={styles.lightboxGestureArea}>
              <PinchGestureHandler
                ref={pinchRef}
                simultaneousHandlers={panRef}
                onGestureEvent={onPinchEvent}
                onHandlerStateChange={onPinchStateChange}
              >
                <Animated.View
                  style={[
                    styles.lightboxImageWrap,
                    {
                      transform: [
                        { translateX },
                        { translateY },
                        { scale },
                      ],
                    },
                  ]}
                >
                  <Image
                    source={{ uri: url }}
                    style={styles.lightboxImage}
                    resizeMode="contain"
                  />
                </Animated.View>
              </PinchGestureHandler>
            </Animated.View>
          </PanGestureHandler>

          {/* Close button absolutely positioned so it sits above the
              gesture area. Its own touch target isn't relayed to the
              gesture handlers thanks to being outside them. */}
          <TouchableOpacity
            style={styles.lightboxClose}
            onPress={onClose}
            hitSlop={12}
            activeOpacity={0.85}
          >
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function MarkdownImage({ url }: { url: string }) {
  const [ratio, setRatio] = useState(16 / 9);
  const [zoomOpen, setZoomOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    Image.getSize(
      url,
      (w, h) => { if (alive && h > 0) setRatio(w / h); },
      () => { },
    );
    return () => { alive = false; };
  }, [url]);

  return (
    <>
      {/* Tap on the image opens the full-screen zoom viewer. Sizing/
          aspect handled on the TouchableOpacity so the touch target
          matches the image's visible box exactly. */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setZoomOpen(true)}
        style={[styles.mdImage, { aspectRatio: ratio }]}
      >
        <Image
          source={{ uri: url }}
          style={styles.mdImageInner}
          resizeMode="cover"
        />
      </TouchableOpacity>
      <ImageLightbox
        url={url}
        visible={zoomOpen}
        onClose={() => setZoomOpen(false)}
      />
    </>
  );
}

// Tính tỉ lệ w/h từ chuỗi SVG thô: ưu tiên viewBox, fallback width/height.
// Trả về 1 (vuông) nếu không đọc được.
function svgAspectRatio(xml: string): number {
  const vb = xml.match(/viewBox\s*=\s*["']\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)\s*["']/i);
  if (vb) {
    const w = parseFloat(vb[1]);
    const h = parseFloat(vb[2]);
    if (w > 0 && h > 0) return w / h;
  }
  const wM = xml.match(/\bwidth\s*=\s*["']?\s*([\d.]+)/i);
  const hM = xml.match(/\bheight\s*=\s*["']?\s*([\d.]+)/i);
  if (wM && hM) {
    const w = parseFloat(wM[1]);
    const h = parseFloat(hM[1]);
    if (w > 0 && h > 0) return w / h;
  }
  return 1; // mặc định vuông
}

// Render một khối SVG thô (<svg>...</svg>) bằng react-native-svg.
// Đọc width/height (hoặc viewBox) để giữ đúng tỉ lệ trong khung full-width.
function MarkdownSvg({ xml }: { xml: string }) {
  const ratio = useMemo(() => svgAspectRatio(xml), [xml]);

  return (
    <View style={[styles.mdSvg, { aspectRatio: ratio }]}>
      <SvgXml xml={xml} width="100%" height="100%" />
    </View>
  );
}

// Render SVG từ một URL .svg. Fetch nội dung để đọc viewBox → giữ đúng tỉ
// lệ (SvgUri không tự biết tỉ lệ nội tại). Trong lúc tải hiển thị khung
// giữ chỗ để layout không nhảy; nếu fetch lỗi, fallback sang SvgUri thẳng.
function MarkdownSvgUri({ url }: { url: string }) {
  const [xml, setXml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setXml(null);
    setFailed(false);
    fetch(url)
      .then(r => r.text())
      .then(t => { if (alive) setXml(t); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [url]);

  // Fetch được nội dung: tái dùng MarkdownSvg (đã tự tính aspectRatio).
  if (xml) return <MarkdownSvg xml={xml} />;

  // Fetch lỗi: vẫn thử render trực tiếp qua SvgUri, tỉ lệ mặc định vuông.
  if (failed) {
    return (
      <View style={[styles.mdSvg, { aspectRatio: 1 }]}>
        <SvgUri uri={url} width="100%" height="100%" />
      </View>
    );
  }

  // Đang tải: khung giữ chỗ vuông.
  return <View style={[styles.mdSvg, { aspectRatio: 1 }]} />;
}

function YoutubeThumb({ url }: { url: string }) {
  const id = youtubeId(url);
  const thumb = id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  return (
    <TouchableOpacity
      style={styles.mdYoutube}
      activeOpacity={0.85}
      onPress={() => openExternal(url)}
    >
      {thumb ? (
        <Image source={{ uri: thumb }} style={styles.mdYoutubeThumb} resizeMode="cover" />
      ) : (
        <View style={[styles.mdYoutubeThumb, styles.mdYoutubeFallback]} />
      )}
      <View style={styles.mdYoutubeOverlay}>
        <View style={styles.mdYoutubePlay}>
          <Ionicons name="play" size={26} color="#FFFFFF" style={{ marginLeft: 3 }} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function SimpleMarkdown({ content }: { content: string }) {
  const lines = (content ?? '').replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (trimmed === '') {
      blocks.push(<View key={key++} style={styles.mdSpacer} />);
      continue;
    }

    // ---- SVG block: gom từ dòng mở <svg đến dòng có </svg> ----
    if (/<svg[\s>]/i.test(trimmed)) {
      let j = i;
      const buf: string[] = [];
      while (j < lines.length) {
        buf.push(lines[j]);
        if (/<\/svg>/i.test(lines[j])) break;
        j++;
      }
      // Chỉ render khi tìm thấy thẻ đóng; nếu không, coi như văn bản thường.
      if (j < lines.length) {
        blocks.push(<MarkdownSvg key={key++} xml={buf.join('\n')} />);
        i = j;
        continue;
      }
    }

    // ---- Table: dòng hiện tại + dòng kế là divider ----
    if (
      isTableRow(trimmed) &&
      i + 1 < lines.length &&
      TABLE_DIVIDER.test(lines[i + 1])
    ) {
      const header = splitTableRow(trimmed);
      const rows: string[][] = [];
      let j = i + 2;
      while (j < lines.length && lines[j].trim() !== '' && isTableRow(lines[j])) {
        rows.push(splitTableRow(lines[j]));
        j++;
      }
      blocks.push(<MarkdownTable key={key++} header={header} rows={rows} />);
      i = j - 1;
      continue;
    }

    // ---- Standalone media: [](url) ảnh / svg / youtube ----
    const media = standaloneMedia(trimmed);
    if (media) {
      blocks.push(
        media.type === 'image'
          ? <MarkdownImage key={key++} url={media.url} />
          : media.type === 'svg'
            ? <MarkdownSvgUri key={key++} url={media.url} />
            : <YoutubeThumb key={key++} url={media.url} />,
      );
      continue;
    }

    // ---- Headings ----
    // Ordered most-specific first so `#### foo` doesn't get consumed
    // by the `### ` prefix check.
    if (trimmed.startsWith('#### ')) {
      blocks.push(<InlineText key={key++} segs={parseInline(trimmed.slice(5))} style={styles.mdH4} />);
      continue;
    }
    if (trimmed.startsWith('### ')) {
      blocks.push(<InlineText key={key++} segs={parseInline(trimmed.slice(4))} style={styles.mdH3} />);
      continue;
    }
    if (trimmed.startsWith('## ')) {
      blocks.push(<InlineText key={key++} segs={parseInline(trimmed.slice(3))} style={styles.mdH2} />);
      continue;
    }
    if (trimmed.startsWith('# ')) {
      blocks.push(<InlineText key={key++} segs={parseInline(trimmed.slice(2))} style={styles.mdH1} />);
      continue;
    }

    // ---- List item ----
    const listMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (listMatch) {
      blocks.push(
        <View key={key++} style={styles.mdListRow}>
          <Text style={styles.mdBullet}>•</Text>
          <InlineText segs={parseInline(listMatch[1])} style={styles.mdListText} />
        </View>,
      );
      continue;
    }

    // ---- Paragraph ----
    blocks.push(<InlineText key={key++} segs={parseInline(trimmed)} style={styles.mdParagraph} />);
  }

  return <View>{blocks}</View>;
}

function MarkdownTable({ header, rows }: { header: string[]; rows: string[][] }) {
  const colCount = header.length;
  return (
    <View style={styles.mdTable}>
      {/* Header */}
      <View style={[styles.mdTableRow, styles.mdTableHeaderRow]}>
        {header.map((cell, ci) => (
          <View key={ci} style={[styles.mdTableCell, ci < colCount - 1 && styles.mdTableCellBorder]}>
            <InlineText segs={parseInline(cell)} style={styles.mdTableHeaderText} />
          </View>
        ))}
      </View>
      {/* Body */}
      {rows.map((row, ri) => (
        <View
          key={ri}
          style={[styles.mdTableRow, ri < rows.length - 1 && styles.mdTableRowBorder]}
        >
          {Array.from({ length: colCount }).map((_, ci) => (
            <View key={ci} style={[styles.mdTableCell, ci < colCount - 1 && styles.mdTableCellBorder]}>
              <InlineText segs={parseInline(row[ci] ?? '')} style={styles.mdTableCellText} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

// ===============================================================
// Pure helpers — extracted for clarity + easy testing.
// ===============================================================

// Walk the rules tree to build a map: bucketChildId → {dimKey, min, max}.
// Only includes children of nodes with a `dimensionKey`.
function buildBucketIndex(rules: MainNode[]): Map<string, ActiveBucket> {
  const map = new Map<string, ActiveBucket>();
  for (const node of rules) {
    const dimKey = (node as any).dimensionKey as string | undefined;
    if (!dimKey || typeof dimKey !== 'string') continue;
    for (const child of node.children) {
      const min = (child as any).min;
      const max = (child as any).max;
      if (typeof min !== 'number' || typeof max !== 'number') continue;
      map.set(child.id, { dimKey, min, max });
    }
  }
  return map;
}

// Walk the rules tree to build a map: dimensionKey → node title.
// Used to render a human label for each measurement row on an option
// (e.g. "tour_de_cheville" → "Tour de cheville") straight from the
// source of truth — no more heuristic underscore splitting.
function buildDimTitleMap(rules: MainNode[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const node of rules) {
    const dimKey = (node as any).dimensionKey as string | undefined;
    if (!dimKey || typeof dimKey !== 'string') continue;
    if (typeof node.title === 'string' && node.title.trim() !== '') {
      map.set(dimKey, node.title);
    }
  }
  return map;
}

// Resolve user's flat filter set into a list of active measurement buckets.
// Non-measurement filters (pathology tags) are dropped.
function resolveActiveBuckets(
  userFilters: Set<string> | undefined,
  rules: MainNode[],
): ActiveBucket[] {
  if (!userFilters || userFilters.size === 0) return [];
  const index = buildBucketIndex(rules);
  const out: ActiveBucket[] = [];
  userFilters.forEach(f => {
    const b = index.get(f);
    if (b) out.push(b);
  });
  return out;
}

// Compute highlight state for a single option.
function computeRowState(
  opt: ProductSizeOption,
  activeBuckets: ActiveBucket[],
): RowState {
  const perDim: Record<string, boolean> = {};

  if (activeBuckets.length === 0) {
    return { opt, matched: false, perDim };
  }

  // For each active bucket, see if this option declares the dimension
  // and whether its range overlaps. Inclusive boundaries (Q7).
  let allOverlap = true;
  let optHasAtLeastOneActiveDim = false;

  for (const bucket of activeBuckets) {
    const m = opt.measurements?.[bucket.dimKey];
    if (!m || typeof m.min !== 'number' || typeof m.max !== 'number') {
      // User filtered on a dimension this option doesn't declare → fail.
      allOverlap = false;
      continue;
    }
    optHasAtLeastOneActiveDim = true;
    // Inclusive overlap test.
    const overlap = m.min <= bucket.max && bucket.min <= m.max;
    if (overlap) {
      perDim[bucket.dimKey] = true;
    } else {
      allOverlap = false;
    }
  }

  const matched = allOverlap && optHasAtLeastOneActiveDim;
  return { opt, matched, perDim };
}

// Turn "tour_de_cheville" → "Tour de cheville" for display.
function humanizeDimKey(key: string): string {
  if (!key) return '';
  return key
    .split('_')
    .map(w => w.length === 0 ? w : w[0].toUpperCase() + w.slice(1))
    .join(' ');
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
    zIndex: 20,
  },
  voirWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 40,
    alignItems: 'center',
    zIndex: 15,
  },
  voirBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(17, 24, 39, 0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 6,
  },
  voirText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    letterSpacing: 0.3,
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
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.3,
  },
  titleStrip: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    // borderBottomWidth: 1,
    // borderBottomColor: palette.border,
    // backgroundColor: palette.cardBg,
  },
  manufacturer: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    fontWeight: '500',
    color: palette.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: palette.textPrimary,
  },
  sub: {
    fontFamily: 'Roboto',
    fontWeight: '500',
    color: palette.textSecondary,
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
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  tabText: {
    fontSize: 12.5,
    fontFamily: 'Poppins-Medium',
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

  // SimpleMarkdown
  mdH1: {
    fontFamily: 'Poppins-Medium',
    fontSize: 20,
    fontWeight: '700',
    color: palette.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 26,
    marginTop: 14,
    marginBottom: 8,
  },
  mdH2: {
    fontFamily: 'Poppins-Medium',
    fontSize: 17,
    fontWeight: '700',
    color: palette.textPrimary,
    letterSpacing: -0.2,
    lineHeight: 23,
    marginTop: 12,
    marginBottom: 6,
  },
  mdH3: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    fontWeight: '700',
    color: palette.textPrimary,
    lineHeight: 21,
    marginTop: 10,
    marginBottom: 4,
  },
  mdH4: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    fontWeight: '700',
    color: palette.textPrimary,
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 4,
  },
  mdParagraph: {
    fontSize: 14,
    lineHeight: 21,
    color: palette.textPrimary,
    marginBottom: 10,
  },
  mdListRow: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingRight: 4,
  },
  mdBullet: {
    fontSize: 14,
    lineHeight: 21,
    color: palette.textSecondary,
    marginRight: 8,
  },
  mdListText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: palette.textPrimary,
  },
  mdBold: {
    fontWeight: '700',
    color: palette.textPrimary,
  },
  mdItalic: {
    fontStyle: 'italic',
  },
  mdSpacer: {
    height: 8,
  },
  mdLink: {
    color: '#1D4ED8',
    textDecorationLine: 'underline',
  },

  // Table
  mdTable: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  mdTableRow: {
    flexDirection: 'row',
  },
  mdTableHeaderRow: {
    backgroundColor: palette.bg,
  },
  mdTableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  mdTableCell: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  mdTableCellBorder: {
    borderRightWidth: 1,
    borderRightColor: palette.border,
  },
  mdTableHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  mdTableCellText: {
    fontSize: 13,
    lineHeight: 19,
    color: palette.textPrimary,
  },

  // Image
  // Media styles below use negative horizontal margins to break out of
  // tabBody's paddingHorizontal (20) and render edge-to-edge across the
  // full modal width. borderRadius is dropped for the same reason —
  // rounded corners at the modal edges look awkward.
  mdImage: {
    width: '100%',
    maxHeight: 220,
    alignSelf: 'center',
    marginBottom: 12,
    backgroundColor: palette.bg,
  },
  // Image inner — the actual Image element inside the tappable
  // wrapper. Fills the wrapper's aspectRatio-driven box exactly.
  mdImageInner: {
    width: '100%',
    height: '100%',
  },

  // SVG
  mdSvg: {
    width: SCREEN_W,
    marginHorizontal: -20,
    marginBottom: 12,
  },

  // Youtube
  mdYoutube: { width: '100%', aspectRatio: 16 / 9, borderRadius: 10, overflow: 'hidden', marginBottom: 12, backgroundColor: '#000', },
  mdYoutubeThumb: {
    width: '100%',
    height: '100%',
  },
  mdYoutubeFallback: {
    backgroundColor: '#1F2937',
  },
  mdYoutubeOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mdYoutubePlay: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(220, 38, 38, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sizes tab
  sizesBody: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#1D4ED8',
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textPrimary,
    letterSpacing: -0.2,
  },
  sectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sectionBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1D4ED8',
    letterSpacing: 0.2,
  },

  // Sizes table — outer wrapper is now a flex-row so the left "Taille"
  // column stays fixed while the right side scrolls horizontally.
  sizesTable: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: palette.cardBg,
    marginBottom: 8,
  },
  // Fixed left column — vertical separator between it and the scrollable
  // area is a right border so the two feel connected but distinct.
  sizesFixedCol: {
    borderRightWidth: 1,
    borderRightColor: palette.border,
    backgroundColor: palette.cardBg,
  },
  sizesTableRow: {
    flexDirection: 'row',
    minHeight: 44,
  },
  // Header row is a fixed height so left/right sides stay lined up even
  // when a dim title wraps to two lines. The bottom border creates a
  // clean separator between the header band and the first data row.
  sizesTableHeaderRow: {
    backgroundColor: palette.bg,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  sizesTableRowMatched: {
    backgroundColor: '#EFF6FF',
  },
  sizesRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },

  // Base cell — flex row so icon + text align in the same line.
  sizesCell: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  sizesCellBorder: {
    borderRightWidth: 1,
    borderRightColor: palette.border,
  },

  // Column width tokens — Taille col has fixed width, data cols are
  // sized dynamically (see SizesTable's dataColWidth computation). When
  // the total data column width would fit inside the visible scroll
  // area, they stretch to fill; otherwise they stay at DATA_COL_MIN
  // and the ScrollView handles overflow.
  sizesTailleCol: {
    width: 110,
  },

  sizesHeaderText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: palette.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    textAlign: 'center',
    flexShrink: 1,
  },

  // Taille (first column) — bold, primary text. Centered inline by the
  // cell's flex layout; textAlign centers wrapped lines too. Matched
  // rows tint blue.
  sizesTailleText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.textPrimary,
    textAlign: 'center',
    flexShrink: 1,
  },
  sizesTailleTextMatched: {
    color: '#1D4ED8',
  },

  // Data cells — range text. Base is muted; hit rows go bold blue.
  sizesCellText: {
    fontSize: 12.5,
    color: palette.textSecondary,
    fontWeight: '500',
  },
  sizesCellTextHit: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  sizesCellTextMissing: {
    color: palette.textMuted,
    fontStyle: 'italic',
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

  // Full-screen image lightbox. Root wraps the Modal contents in a
  // GestureHandlerRootView so pinch/pan work inside the modal on
  // Android. Backdrop is near-opaque black.
  lightboxRoot: {
    flex: 1,
  },
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
  },
  // Gesture area fills the backdrop; transforms are applied to the
  // image wrap inside so the whole image scales/pans as one unit.
  lightboxGestureArea: {
    flex: 1,
  },
  lightboxImageWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxImage: {
    width: '100%',
    height: '100%',
  },
  lightboxClose: {
    position: 'absolute',
    top: 44,
    right: 18,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});