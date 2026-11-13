import React from 'react';
import { View, Text, Image, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';
import MediaSkeleton from '../../media/components/MediaSkeleton';
import { IContent } from '../../../utils/interfaces';

// Une grande vidéo puis une liste courte : le reste est dans Médias via « Tout voir ».
const LIST_COUNT = 4;

export interface LatestContentsProps {
  entries?: IContent[];
  isLoading: boolean;
  isError: boolean;
  onReload: () => void;
  onSelect: (item: IContent) => void;
  onSeeAll: () => void;
}

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
          <Pressable onPress={onReload} hitSlop={10} accessibilityRole="button">
            <Text style={styles.headerLink}>Recharger</Text>
          </Pressable>
        ) : (
          <Pressable onPress={onSeeAll} hitSlop={10} accessibilityRole="link">
            <Text style={styles.headerLink}>Tout voir</Text>
          </Pressable>
        )}
      </View>

      {isLoading && <MediaSkeleton numberOfObjects={3} />}

      {!isLoading && !isError && featured && (
        <>
          {/* ---- Vidéo à la une ---- */}
          <Pressable style={styles.featured} onPress={() => onSelect(featured)} accessibilityRole="button">
            <View style={styles.featuredMedia}>
              {featured.thumbnail ? (
                <Image source={{ uri: featured.thumbnail }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : null}
              <View style={styles.play}>
                <Ionicons name="play" size={20} color={Colors.primary} style={styles.playIcon} />
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
          {rest.slice(0, LIST_COUNT).map((item) => (
            <Pressable
              key={item.id_content}
              style={styles.row}
              onPress={() => onSelect(item)}
              accessibilityRole="button"
            >
              <View style={styles.rowThumb}>
                {item.thumbnail ? (
                  <Image source={{ uri: item.thumbnail }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : null}
              </View>
              <View style={styles.rowTexts}>
                <Text style={styles.rowAuthor} numberOfLines={1}>{authorOf(item)}</Text>
                <Text style={styles.rowTitle} numberOfLines={2}>{item.title}</Text>
                {!!item.duration && (
                  <View style={styles.rowDuration}>
                    <Ionicons name="time-outline" size={13} color={Colors.warmMuted} />
                    <Text style={styles.rowMeta}>{item.duration}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          ))}
        </>
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
    fontSize: 17,
    lineHeight: 24,
    color: Colors.text,
    fontFamily: 'Poppins-Medium',
  },
  headerLink: {
    fontSize: 13,
    color: Colors.primary,
    fontFamily: 'Poppins-Medium',
  },

  /* ---- Vidéo à la une ---- */
  featured: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.warmBorder,
    backgroundColor: Colors.white,
  },
  featuredMedia: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.orange3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  play: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    marginLeft: 3,
  },
  duration: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    height: 24,
    paddingHorizontal: Spacings.xs,
    borderRadius: 999,
    backgroundColor: Colors.white,
    justifyContent: 'center',
  },
  durationText: {
    fontSize: 11,
    color: Colors.text,
    fontFamily: 'Poppins-Regular',
  },
  featuredBody: {
    padding: Spacings.sm,
  },
  featuredAuthor: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: Spacings.xxs,
    color: Colors.primary,
    fontFamily: 'Poppins-Medium',
  },
  featuredTitle: {
    fontSize: 15,
    lineHeight: 21,
    color: Colors.text,
    fontFamily: 'Poppins-Medium',
  },

  /* ---- Liste ---- */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    paddingVertical: Spacings.sm,
  },
  rowThumb: {
    width: 120,
    height: 68,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.grayLight,
  },
  rowTexts: {
    flex: 1,
    minWidth: 0,
  },
  rowAuthor: {
    fontSize: 11,
    lineHeight: 16,
    color: Colors.primary,
    fontFamily: 'Poppins-Medium',
  },
  rowTitle: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text,
    fontFamily: 'Poppins-Medium',
  },
  rowDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  rowMeta: {
    fontSize: 11,
    lineHeight: 16,
    color: Colors.warmMuted,
    fontFamily: 'Poppins-Regular',
  },
});
