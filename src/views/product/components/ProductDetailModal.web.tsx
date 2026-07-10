import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SvgUri, SvgXml } from 'react-native-svg';
import { MainNode } from '../lib/Logic';
import { Product, ProductSizeOption } from '../lib/Products';
import { palette } from '../lib/Theme';
import { getRules } from '../../../services/v2/ProductService';

// Web-only style props not present in React Native's type definitions.
const webClickable = { cursor: 'pointer' } as any;

// Aspect-ratio threshold at which markdown media renders edge-to-edge.
const LANDSCAPE_MIN_RATIO = 1.3;
const CONTAINED_MAX = 280;

type ProductDetailModalProps = {
  visible: boolean;
  product: Product | null;
  // Flat set of childIds the user has selected (pathology + measurement
  // buckets combined). Measurement buckets resolve to numeric ranges via
  // the fetched rules tree, used for taille overlap highlighting.
  userFilters?: Set<string>;
  onClose: () => void;
  // WEB: render inline inside the right-hand panel instead of a slide-up
  // Modal. The web ProductsScreen always passes embedded.
  embedded?: boolean;
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
  visible, product, userFilters, onClose, embedded = false,
}: ProductDetailModalProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);

  // Measure the panel so the image band can be a fixed 30% of ITS height
  // (not the screen). Captured via onLayout on the root container.
  const [panelH, setPanelH] = useState(0);
  const IMAGE_H = panelH > 0 ? Math.round(panelH * 0.3) : 0;

  // Thumbnail strip height: thumb (44) + vertical padding (8 top + 8 bottom).
  const THUMB_STRIP_H = 44 + 16;
  const hasThumbs = (product?.images?.length ?? 0) > 1;
  // Main image height = full image band minus the thumbnail strip (only
  // when thumbnails are shown). Otherwise the image takes the whole band.
  const MAIN_IMAGE_H = hasThumbs ? Math.max(IMAGE_H - THUMB_STRIP_H, 0) : IMAGE_H;

  // Track the panel's inner width so markdown media (SVG) can size to it
  // instead of the full screen (panel is only ~40% of the window).
  const [contentW, setContentW] = useState(0);

  // Fetch rules — shared cache via React Query under a stable key.
  const { data: rules = [] } = useQuery({
    queryKey: ['product-rules'],
    queryFn: () => getRules(),
    retry: 1,
    retryDelay: 1000,
  });

  useEffect(() => {
    setActiveTab(0);
    setImageIndex(0);
  }, [product?.id]);

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

  // Empty state — no product selected yet.
  if (!product) {
    if (embedded) {
      return (
        <View style={styles.embeddedEmpty}>
          <Ionicons name="cube-outline" size={40} color={palette.textMuted} />
          <Text style={styles.embeddedEmptyText}>
            Sélectionnez un produit pour afficher ses détails.
          </Text>
        </View>
      );
    }
    return <Modal visible={false} transparent />;
  }

  const current = tabs[activeTab];

  // Shared inner content — the panel body. Image band (30%) on top, then
  // title strip, tabs bar, and the active tab's content filling the rest.
  const inner = (
    <View
      style={styles.embeddedContainer}
      onLayout={e => {
        const { height, width } = e.nativeEvent.layout;
        if (height !== panelH) setPanelH(height);
        if (width !== contentW) setContentW(width);
      }}
    >
      {/* Close (X) — top-right, returns to the filter summary. */}
      <TouchableOpacity
        style={[styles.closeBtn, webClickable]}
        onPress={onClose}
        hitSlop={10}
        activeOpacity={0.85}
      >
        <Ionicons name="close" size={22} color={palette.textPrimary} />
      </TouchableOpacity>

      {/* Image area — fixed 30% of the panel height. One large image on
          top; if there are multiple, a strip of small thumbnails below
          lets the user pick which one shows large. */}
      <View style={[styles.imageArea, { height: IMAGE_H }]}>
        {product.images.length > 0 && IMAGE_H > 0 && (
          <>
            <View style={[styles.mainImageWrap, { height: MAIN_IMAGE_H }]}>
              <Image
                source={{ uri: product.images[imageIndex] || product.images[0] }}
                style={styles.mainImage}
                resizeMode="contain"
              />
            </View>

            {product.images.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbRow}
              >
                {product.images.map((img, i) => {
                  const active = i === imageIndex;
                  return (
                    <TouchableOpacity
                      key={`thumb-${i}`}
                      style={[styles.thumb, webClickable, active && styles.thumbActive]}
                      onPress={() => setImageIndex(i)}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={{ uri: img }}
                        style={styles.thumbImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </>
        )}
      </View>

      {/* Title strip */}
      <View style={styles.titleStrip}>
        <Text style={styles.manufacturer}>{product.manufacturer}</Text>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        {!!product.sub && (
          <Text style={styles.sub} numberOfLines={2}>
            {product.sub}
          </Text>
        )}
      </View>

      {/* Tabs bar */}
      <View style={styles.tabsBar}>
        {tabs.length > 0 ? (
          <View style={styles.tabsRow}>
            {tabs.map((t, i) => {
              const active = activeTab === i;
              return (
                <Pressable
                  key={`${t.title}-${i}`}
                  onPress={() => setActiveTab(i)}
                  style={[styles.tab, webClickable, active && styles.tabActive]}
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
          </View>
        ) : (
          <View style={{ height: 50 }} />
        )}
      </View>

      {/* Tab content — fills remaining panel height. */}
      <View style={styles.tabContent}>
        {tabs.length === 0 ? (
          <View style={styles.placeholderBox}>
            <Ionicons
              name="document-text-outline"
              size={28}
              color={palette.textMuted}
            />
            <Text style={styles.placeholderText}>Aucun détail disponible</Text>
            <Text style={styles.placeholderSub}>
              Ce produit n'a pas encore de description.
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
              containerWidth={contentW > 40 ? contentW - 40 : contentW}
            />
          </ScrollView>
        )}
      </View>
    </View>
  );

  // ---- WEB: embedded inline panel
  if (embedded) return inner;

  // ---- Fallback: original bottom-sheet Modal (kept for parity)
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>{inner}</View>
      </View>
    </Modal>
  );
}

// ===============================================================
// Sizes tab content — flat options with per-option measurements.
// ===============================================================

function SizesTabContent({
  options, userFilters, rules,
}: {
  options: ProductSizeOption[];
  userFilters?: Set<string>;
  rules: MainNode[];
}) {
  const activeBuckets = useMemo(
    () => resolveActiveBuckets(userFilters, rules),
    [userFilters, rules],
  );

  const dimTitleMap = useMemo(() => buildDimTitleMap(rules), [rules]);

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
      {!hasActive && (
        <View style={styles.hintBox}>
          <Ionicons name="information-circle-outline" size={16} color="#1D4ED8" />
          <Text style={styles.hintText}>
            Sélectionnez une mesure dans le filtre pour voir la taille recommandée.
          </Text>
        </View>
      )}

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
// SizesTable — fixed "Taille" column + horizontally scrollable data cols.
// ===============================================================
function SizesTable({
  rows, dimTitleMap,
}: {
  rows: RowState[];
  dimTitleMap: Map<string, string>;
}) {
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
      {/* Left: fixed Taille column */}
      <View style={styles.sizesFixedCol}>
        <View style={[styles.sizesTableRow, styles.sizesTableHeaderRow]}>
          <View style={[styles.sizesCell, styles.sizesTailleCol]}>
            <Text style={styles.sizesHeaderText} numberOfLines={1}>Taille</Text>
          </View>
        </View>
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

      {/* Right: horizontally scrollable data columns */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        style={{ flex: 1 }}
        onLayout={(e) => setScrollAreaWidth(e.nativeEvent.layout.width)}
      >
        <View>
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
// SimpleMarkdown — lightweight markdown parser (no external lib).
// Web note: the original lightbox (pinch/pan zoom via
// react-native-gesture-handler) is removed. Images are static — tapping
// does nothing, per the web spec.
// ===============================================================

type Seg =
  | { kind: 'text'; text: string; bold?: boolean; italic?: boolean }
  | { kind: 'link'; text: string; url: string };

function openExternal(url: string) {
  Linking.openURL(url).catch(() => { });
}

function isSvgUrl(url: string): boolean {
  return /\.svg(\?.*)?$/i.test(url.trim());
}

function isImageUrl(url: string): boolean {
  return /\.(png|jpe?g|gif|webp|bmp)(\?.*)?$/i.test(url.trim());
}

function isYoutubeUrl(url: string): boolean {
  return /(?:youtube\.com\/|youtu\.be\/)/i.test(url.trim());
}

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

function parseInline(line: string): Seg[] {
  const segs: Seg[] = [];
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
            <Text key={i} style={[styles.mdLink, webClickable]} onPress={() => openExternal(s.url)}>
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

const TABLE_DIVIDER = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

function isTableRow(line: string): boolean {
  return line.trim().startsWith('|') || line.includes('|');
}

function splitTableRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map(c => c.trim());
}

function standaloneMedia(
  trimmed: string,
): { type: 'image' | 'svg' | 'youtube'; url: string } | null {
  const m = trimmed.match(/^\[\s*\]\(([^)]*)\)$/);
  if (!m) return null;
  const url = m[1].trim();
  if (isSvgUrl(url)) return { type: 'svg', url };
  if (isImageUrl(url)) return { type: 'image', url };
  if (isYoutubeUrl(url)) return { type: 'youtube', url };
  return null;
}

// Static markdown image — on web there's no lightbox, tapping does nothing.
// Sized so it never distorts and never overflows: fit within the panel
// width first, then cap the height at MAX_H (reducing width to keep ratio).
function MarkdownImage({ url, containerWidth }: { url: string; containerWidth: number }) {
  const [ratio, setRatio] = useState(16 / 9);

  useEffect(() => {
    let alive = true;
    Image.getSize(
      url,
      (w, h) => { if (alive && h > 0) setRatio(w / h); },
      () => { },
    );
    return () => { alive = false; };
  }, [url]);

  const MAX_H = 250;

  // Start from the natural size at MAX_H height.
  let h = MAX_H;
  let w = MAX_H * ratio;

  // If that width exceeds the panel, clamp width to the panel and derive
  // height from the ratio (which will then be < MAX_H).
  const maxW = containerWidth > 0 ? containerWidth : w;
  if (w > maxW) {
    w = maxW;
    h = w / ratio;
  }

  return (
    <View style={styles.mdImageWrap}>
      <Image
        source={{ uri: url }}
        style={{ width: w, height: h }}
        resizeMode="contain"
      />
    </View>
  );
}

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
  return 1;
}

function MarkdownSvg({ xml, containerWidth }: { xml: string; containerWidth: number }) {
  const ratio = useMemo(() => svgAspectRatio(xml), [xml]);
  return (
    <View style={[styles.mdSvg, { width: containerWidth || '100%', aspectRatio: ratio }]}>
      <SvgXml xml={xml} width="100%" height="100%" />
    </View>
  );
}

function MarkdownSvgUri({ url, containerWidth }: { url: string; containerWidth: number }) {
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

  if (xml) return <MarkdownSvg xml={xml} containerWidth={containerWidth} />;

  if (failed) {
    return (
      <View style={[styles.mdSvg, { width: containerWidth || '100%', aspectRatio: 1 }]}>
        <SvgUri uri={url} width="100%" height="100%" />
      </View>
    );
  }

  return <View style={[styles.mdSvg, { width: containerWidth || '100%', aspectRatio: 1 }]} />;
}

function YoutubeThumb({ url }: { url: string }) {
  const id = youtubeId(url);
  const thumb = id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  return (
    <TouchableOpacity
      style={[styles.mdYoutube, webClickable]}
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

function SimpleMarkdown({ content, containerWidth }: { content: string; containerWidth: number }) {
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

    if (/<svg[\s>]/i.test(trimmed)) {
      let j = i;
      const buf: string[] = [];
      while (j < lines.length) {
        buf.push(lines[j]);
        if (/<\/svg>/i.test(lines[j])) break;
        j++;
      }
      if (j < lines.length) {
        blocks.push(<MarkdownSvg key={key++} xml={buf.join('\n')} containerWidth={containerWidth} />);
        i = j;
        continue;
      }
    }

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

    const media = standaloneMedia(trimmed);
    if (media) {
      blocks.push(
        media.type === 'image'
          ? <MarkdownImage key={key++} url={media.url} containerWidth={containerWidth} />
          : media.type === 'svg'
            ? <MarkdownSvgUri key={key++} url={media.url} containerWidth={containerWidth} />
            : <YoutubeThumb key={key++} url={media.url} />,
      );
      continue;
    }

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

    blocks.push(<InlineText key={key++} segs={parseInline(trimmed)} style={styles.mdParagraph} />);
  }

  return <View>{blocks}</View>;
}

function MarkdownTable({ header, rows }: { header: string[]; rows: string[][] }) {
  const colCount = header.length;
  return (
    <View style={styles.mdTable}>
      <View style={[styles.mdTableRow, styles.mdTableHeaderRow]}>
        {header.map((cell, ci) => (
          <View key={ci} style={[styles.mdTableCell, ci < colCount - 1 && styles.mdTableCellBorder]}>
            <InlineText segs={parseInline(cell)} style={styles.mdTableHeaderText} />
          </View>
        ))}
      </View>
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
// Pure helpers.
// ===============================================================

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

function computeRowState(
  opt: ProductSizeOption,
  activeBuckets: ActiveBucket[],
): RowState {
  const perDim: Record<string, boolean> = {};

  if (activeBuckets.length === 0) {
    return { opt, matched: false, perDim };
  }

  let allOverlap = true;
  let optHasAtLeastOneActiveDim = false;

  for (const bucket of activeBuckets) {
    const m = opt.measurements?.[bucket.dimKey];
    if (!m || typeof m.min !== 'number' || typeof m.max !== 'number') {
      allOverlap = false;
      continue;
    }
    optHasAtLeastOneActiveDim = true;
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

function humanizeDimKey(key: string): string {
  if (!key) return '';
  return key
    .split('_')
    .map(w => w.length === 0 ? w : w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

const styles = StyleSheet.create({
  // WEB embedded container — fills the right panel.
  embeddedContainer: {
    flex: 1,
    backgroundColor: palette.cardBg,
  },
  embeddedEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    backgroundColor: palette.cardBg,
  },
  embeddedEmptyText: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: palette.textMuted,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },

  // Fallback modal styles
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  card: {
    height: '90%',
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

  // Image area — fixed 30% of panel height. Column: main image fills the
  // available space, thumbnail strip sits at the bottom.
  imageArea: {
    width: '100%',
    backgroundColor: palette.bg,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  mainImageWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  // Thumbnail strip along the bottom of the image area.
  thumbRow: {
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: palette.cardBg,
  },
  thumbActive: {
    borderColor: '#3B82F6',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
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
  sub: {
    fontSize: 12.5,
    fontWeight: '500',
    color: palette.textSecondary,
    marginTop: 4,
    lineHeight: 17,
  },

  tabsBar: {
    flexShrink: 0,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: palette.cardBg,
  },
  tabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  tab: {
    flexShrink: 0,
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

  // Tab content fills the remaining panel height below the tabs bar.
  tabContent: {
    flex: 1,
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

  // Markdown image wrapper — left-aligned, image sizes itself by ratio.
  mdImageWrap: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    backgroundColor: palette.bg,
  },
  mdSvg: {
    marginBottom: 12,
  },

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

  sizesTable: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: palette.cardBg,
    marginBottom: 8,
  },
  sizesFixedCol: {
    borderRightWidth: 1,
    borderRightColor: palette.border,
    backgroundColor: palette.cardBg,
  },
  sizesTableRow: {
    flexDirection: 'row',
    minHeight: 44,
  },
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
});