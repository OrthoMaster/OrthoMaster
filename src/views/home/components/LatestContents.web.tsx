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
 * xl : vidéo à la une à gauche, 8 vidéos sur 2 colonnes à droite.
 * Le nombre de lignes suit la hauteur de la vidéo à la une pour que les deux côtés finissent ensemble.
 */
const LAYOUTS: Record<HomeBreakpoint, { listCount: number; listColumns: number; thumbWidth: number }> = {
  md: { listCount: 4, listColumns: 2, thumbWidth: 120 },
  lg: { listCount: 4, listColumns: 1, thumbWidth: 160 },
  xl: { listCount: 8, listColumns: 2, thumbWidth: 136 },
};

const authorOf = (item: IContent) => item.expert_names || 'OrthoMaster';

export const LatestContents = ({ entries, isLoading, isError, onReload, onSelect, onSeeAll }: LatestContentsProps) => {
  const [featured, ...rest] = entries ?? [];
  const { breakpoint } = useHomeLayout();
  const layout = LAYOUTS[breakpoint];
  const isBanner = breakpoint === 'md';
  const listItems = rest.slice(0, layout.listCount);
  const columns = Array.from({ length: layout.listColumns }, (_, col) =>
    listItems.filter((_, index) => index % layout.listColumns === col)
  );

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nos derniers contenus</Text>
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

      {!isLoading && !isError && featured && (
        <View style={[styles.layout, isBanner && styles.layoutStacked]}>
          {/* ---- Vidéo à la une ---- */}
          <Pressable
            onPress={() => onSelect(featured)}
            accessibilityRole="button"
            style={(state: any) => [
              styles.featured,
              breakpoint === 'xl' && styles.featuredXl,
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
          <View style={[styles.list, isBanner && styles.listBanner, breakpoint === 'xl' && styles.listXl]}>
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
                      <Text style={styles.rowTitle} numberOfLines={2}>{item.title}</Text>
                      <Text style={styles.rowMeta} numberOfLines={1}>
                        {[authorOf(item), item.duration].filter(Boolean).join(' · ')}
                      </Text>
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
    color: Colors.primaryInk,
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
  featuredXl: {
    flexBasis: 520,
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
    color: Colors.primaryInk,
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
  listXl: {
    flexGrow: 1.4,
    flexBasis: 640,
  },
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
  rowTitle: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
    fontFamily: 'Poppins-Medium',
  },
  rowMeta: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
    color: Colors.warmMuted,
    fontFamily: 'Poppins-Regular',
  },
});
