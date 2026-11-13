import React from 'react';
import { View, Text, Image, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';
import MediaSkeleton from '../../media/components/MediaSkeleton';
import type { LatestContentsProps } from './LatestContents';
import { IContent } from '../../../utils/interfaces';
import { HomeBreakpoint, useHomeLayout } from './useHomeLayout';

/*
 * md : vidéo à la une en bandeau (image à gauche, texte à droite), puis 4 vidéos sur 2 colonnes.
 * lg : vidéo à la une à gauche, 4 vidéos en liste à droite.
 * xl : vidéo à la une à gauche, 4 vidéos du même style en grille 2 × 2 à droite (voir XlGrid).
 */
const LAYOUTS: Record<Exclude<HomeBreakpoint, 'xl'>, { listCount: number; listColumns: number; thumbWidth: number }> = {
  md: { listCount: 4, listColumns: 2, thumbWidth: 120 },
  lg: { listCount: 4, listColumns: 1, thumbWidth: 160 },
};

/* ---- xl : grille ---- */
const XL_GAP = 20;
const BIG_BODY = 96;
const SMALL_BODY = 86;
const RATIO = 9 / 16;

/**
 * Largeurs calculées pour que la vidéo à la une et les deux rangées de petites vidéos finissent à la même hauteur :
 * F·r + BIG_BODY = 2·(s·r + SMALL_BODY) + gap, avec s = (R − gap) / 2 et F + gap + R = largeur.
 * L'écart entre les vignettes reste fixe quelle que soit la taille de l'écran.
 */
const xlWidths = (innerWidth: number) => {
  const delta = (2 * SMALL_BODY + XL_GAP - BIG_BODY) / RATIO - XL_GAP;
  const right = (innerWidth - XL_GAP - delta) / 2;
  return { featured: innerWidth - XL_GAP - right, right, small: (right - XL_GAP) / 2 };
};

const VideoCard = ({ item, width, big, onPress }: { item: IContent; width: number; big?: boolean; onPress: () => void }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    style={(state: any) => [styles.card, { width }, state.hovered && styles.lifted]}
  >
    <View style={[styles.featuredMedia, { height: width * RATIO }]}>
      {item.thumbnail ? (
        <Image source={{ uri: item.thumbnail }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : null}
      <View style={[styles.play, !big && styles.playSmall]}>
        <Ionicons name="play" size={big ? 22 : 16} color={Colors.primary} style={styles.playIcon} />
      </View>
      {!!item.duration && (
        <View style={styles.duration}>
          <Text style={styles.durationText}>{item.duration}</Text>
        </View>
      )}
    </View>
    <View style={[styles.featuredBody, { height: big ? BIG_BODY : SMALL_BODY }]}>
      <Text style={styles.featuredAuthor} numberOfLines={1}>{authorOf(item)}</Text>
      <Text style={big ? styles.featuredTitle : styles.cardTitleSmall} numberOfLines={2}>{item.title}</Text>
    </View>
  </Pressable>
);

const authorOf = (item: IContent) => item.expert_names || 'OrthoMaster';

export const LatestContents = ({ entries, isLoading, isError, onReload, onSelect, onSeeAll }: LatestContentsProps) => {
  const [featured, ...rest] = entries ?? [];
  const { breakpoint, innerWidth, headingStyle } = useHomeLayout();
  const isXl = breakpoint === 'xl';
  const layout = LAYOUTS[isXl ? 'lg' : breakpoint];
  const isBanner = breakpoint === 'md';
  const listItems = rest.slice(0, layout.listCount);
  const columns = Array.from({ length: layout.listColumns }, (_, col) =>
    listItems.filter((_, index) => index % layout.listColumns === col)
  );

  return (
    <View>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, headingStyle]}>Nos derniers contenus</Text>
        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.gray} />
        ) : isError ? (
          <Pressable onPress={onReload} accessibilityRole="button">
            <Text style={styles.headerLink}>Recharger</Text>
          </Pressable>
        ) : (
          <Pressable onPress={onSeeAll} accessibilityRole="link">
            <Text style={styles.headerLink}>Tout voir</Text>
          </Pressable>
        )}
      </View>

      {isLoading && <MediaSkeleton numberOfObjects={4} horizontal />}

      {!isLoading && !isError && featured && isXl && (() => {
        const widths = xlWidths(innerWidth);
        return (
          <View style={styles.xlRow}>
            <VideoCard item={featured} width={widths.featured} big onPress={() => onSelect(featured)} />
            <View style={[styles.xlGrid, { width: widths.right }]}>
              {rest.slice(0, 4).map((item) => (
                <VideoCard key={item.id_content} item={item} width={widths.small} onPress={() => onSelect(item)} />
              ))}
            </View>
          </View>
        );
      })()}

      {!isLoading && !isError && featured && !isXl && (
        <View style={[styles.layout, isBanner && styles.layoutStacked]}>
          {/* ---- Vidéo à la une ---- */}
          <Pressable
            onPress={() => onSelect(featured)}
            accessibilityRole="button"
            style={(state: any) => [
              styles.featured,
              isBanner && styles.featuredBanner,
              state.hovered && styles.lifted,
            ]}
          >
            <View style={[styles.featuredMedia, isBanner && styles.featuredMediaBanner]}>
              {featured.thumbnail ? (
                <Image source={{ uri: featured.thumbnail }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : null}
              <View style={styles.play}>
                <Ionicons name="play" size={22} color={Colors.primary} style={styles.playIcon} />
              </View>
              {!!featured.duration && (
                <View style={styles.duration}>
                  <Text style={styles.durationText}>{featured.duration}</Text>
                </View>
              )}
            </View>
            <View style={[styles.featuredBody, isBanner && styles.featuredBodyBanner]}>
              <Text style={styles.featuredAuthor} numberOfLines={1}>{authorOf(featured)}</Text>
              <Text
                style={[styles.featuredTitle, isBanner && styles.featuredTitleBanner]}
                numberOfLines={isBanner ? 3 : 2}
              >
                {featured.title}
              </Text>
            </View>
          </Pressable>

          {/* ---- Liste ---- */}
          <View style={[styles.list, isBanner && styles.listBanner]}>
            {columns.map((column, col) => (
              <View key={col} style={styles.listColumn}>
                {column.map((item) => (
                  <Pressable
                    key={item.id_content}
                    onPress={() => onSelect(item)}
                    accessibilityRole="button"
                    style={(state: any) => [styles.row, state.hovered && styles.rowHovered]}
                  >
                    <View style={[styles.rowThumb, { width: layout.thumbWidth, height: layout.thumbWidth * 9 / 16 }]}>
                      {item.thumbnail ? (
                        <Image source={{ uri: item.thumbnail }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                      ) : null}
                    </View>
                    <View style={styles.rowTexts}>
                      <Text style={styles.rowAuthor} numberOfLines={1}>{authorOf(item)}</Text>
                      <Text style={styles.rowTitle} numberOfLines={2}>{item.title}</Text>
                      {!!item.duration && (
                        <View style={styles.rowDuration}>
                          <Ionicons name="time-outline" size={14} color={Colors.warmMuted} />
                          <Text style={styles.rowMeta}>{item.duration}</Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  /* ---- En-tête ---- */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacings.sm,
  },
  headerTitle: {
    fontSize: 18,
    lineHeight: 26,
    color: Colors.text,
    fontFamily: 'Poppins-Medium',
  },
  headerLink: {
    fontSize: 13,
    color: Colors.primary,
    fontFamily: 'Poppins-Medium',
  },

  /* ---- Mise en page ---- */
  layout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  layoutStacked: {
    flexDirection: 'column',
  },
  lifted: {
    transform: [{ translateY: -3 }],
  },

  /* ---- Vidéo à la une ---- */
  featured: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 380,
    minWidth: 0,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.warmBorder,
    backgroundColor: Colors.white,
    transitionProperty: 'transform',
    transitionDuration: '150ms',
  } as any,
  xlRow: {
    flexDirection: 'row',
    gap: XL_GAP,
  },
  xlGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: XL_GAP,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.warmBorder,
    backgroundColor: Colors.white,
    transitionProperty: 'transform',
    transitionDuration: '150ms',
  } as any,
  cardTitleSmall: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
    fontFamily: 'Poppins-Medium',
  },
  featuredBanner: {
    flexDirection: 'row',
    flexBasis: 'auto',
  } as any,
  featuredMedia: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.orange3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredMediaBanner: {
    width: '55%',
  },
  play: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playSmall: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  playIcon: {
    marginLeft: 3,
  },
  duration: {
    position: 'absolute',
    right: Spacings.sm,
    bottom: Spacings.sm,
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: Colors.white,
    justifyContent: 'center',
  },
  durationText: {
    fontSize: 12,
    color: Colors.text,
    fontFamily: 'Poppins-Regular',
  },
  featuredBody: {
    paddingVertical: Spacings.sm,
    paddingHorizontal: 14,
  },
  featuredBodyBanner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacings.lg,
  },
  featuredAuthor: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: Spacings.xxs,
    color: Colors.primary,
    fontFamily: 'Poppins-Medium',
  },
  featuredTitle: {
    fontSize: 16,
    lineHeight: 23,
    color: Colors.text,
    fontFamily: 'Poppins-Medium',
  },

  featuredTitleBanner: {
    fontSize: 18,
    lineHeight: 26,
  },

  /* ---- Liste ---- */
  list: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 300,
    minWidth: 0,
    flexDirection: 'row',
    gap: Spacings.md,
  },
  listBanner: {
    flexBasis: 'auto',
  } as any,
  listColumn: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'space-between',
    gap: Spacings.xxs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: Spacings.xs,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  rowHovered: {
    backgroundColor: Colors.warmBackground,
  },
  rowThumb: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.grayLight,
  },
  rowTexts: {
    flex: 1,
    minWidth: 0,
  },
  rowAuthor: {
    fontSize: 12,
    lineHeight: 17,
    color: Colors.primary,
    fontFamily: 'Poppins-Medium',
  },
  rowDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  rowTitle: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
    fontFamily: 'Poppins-Medium',
  },
  rowMeta: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.warmMuted,
    fontFamily: 'Poppins-Regular',
  },
});
