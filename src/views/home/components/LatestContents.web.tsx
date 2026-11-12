import React from 'react';
import { View, Text, Image, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';
import MediaSkeleton from '../../media/components/MediaSkeleton';
import type { LatestContentsProps } from './LatestContents';
import { IContent } from '../../../utils/interfaces';

// La colonne de droite garde la hauteur de la vidéo à la une.
const LIST_COUNT = 3;

const authorOf = (item: IContent) => item.expert_names || 'OrthoMaster';

export const LatestContents = ({ entries, isLoading, isError, onReload, onSelect, onSeeAll }: LatestContentsProps) => {
  const [featured, ...rest] = entries ?? [];

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
        <View style={styles.layout}>
          {/* ---- Vidéo à la une ---- */}
          <Pressable
            onPress={() => onSelect(featured)}
            accessibilityRole="button"
            style={(state: any) => [styles.featured, state.hovered && styles.lifted]}
          >
            <View style={styles.featuredMedia}>
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
            <View style={styles.featuredBody}>
              <Text style={styles.featuredAuthor} numberOfLines={1}>{authorOf(featured)}</Text>
              <Text style={styles.featuredTitle} numberOfLines={2}>{featured.title}</Text>
            </View>
          </Pressable>

          {/* ---- Liste ---- */}
          <View style={styles.list}>
            {rest.slice(0, LIST_COUNT).map((item) => (
              <Pressable
                key={item.id_content}
                onPress={() => onSelect(item)}
                accessibilityRole="button"
                style={(state: any) => [styles.row, state.hovered && styles.rowHovered]}
              >
                <View style={styles.rowThumb}>
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
  lifted: {
    transform: [{ translateY: -3 }],
  },

  /* ---- Vidéo à la une ---- */
  featured: {
    flexGrow: 1.3,
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
  featuredMedia: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.orange3,
    alignItems: 'center',
    justifyContent: 'center',
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

  /* ---- Liste ---- */
  list: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 300,
    minWidth: 0,
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
    width: 136,
    height: 77,
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
