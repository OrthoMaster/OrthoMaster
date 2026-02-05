import React, { FC } from 'react';
import {
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  View,
  ScrollView,
  Platform,
} from 'react-native';
import { useQuery } from "@tanstack/react-query";
import { getS3Image } from '../services/S3Service';

import AntDesign from '@expo/vector-icons/AntDesign';
import Colors from '../../constants/Colors';
import Spacings from '../../constants/Spacings';

export interface MediaItem {
  id_content: string | number;
  title: string;
  author: string;
  s3_path: string;
  duration: string;
}

interface CarousselCardProps {
  item: MediaItem;
  onPress: () => void;
}

const isWeb = Platform.OS === 'web';

const CarousselCard: FC<CarousselCardProps> = ({ item, onPress }) => {
  const imageUrl = useQuery<string>({
    queryKey: ['Home', 'GET', 'contentThumbnail', item.id_content, item.title],
    queryFn: () => getS3Image(`${item.s3_path}/${item.title}/logo.png`)
  });

  // --- VERSION WEB ---
  if (isWeb) {
    return (
      <TouchableOpacity style={styles.cardWeb} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.imageContainerWeb}>
          {imageUrl.data ? (
            <Image style={styles.thumbnail} source={{ uri: imageUrl.data }} />
          ) : (
            <View style={[styles.thumbnail, { backgroundColor: Colors.grayLight }]} />
          )}
        </View>
        <View style={styles.detailWeb}>
          <View style={styles.metaRow}>
            <Text style={styles.author} numberOfLines={1}>{item.author}</Text>
            <View style={styles.durationBadge}>
              <AntDesign name="clock-circle" size={10} color={Colors.gray} style={{ marginRight: 4 }} />
              <Text style={styles.metaText}>{item.duration}</Text>
            </View>
          </View>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // --- VERSION MOBILE ---
  return (
    <TouchableOpacity style={styles.cardMobile} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.imageContainerMobile}>
        {imageUrl.data ? (
          <Image style={styles.thumbnailMobile} source={{ uri: imageUrl.data }} />
        ) : (
          <View style={[styles.thumbnailMobile, { backgroundColor: Colors.grayLight }]} />
        )}
      </View>
      <View style={styles.detailMobile}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.author} numberOfLines={1}>{item.author}</Text>
        <View style={styles.metaRowMobile}>
          <AntDesign name="clock-circle" size={10} color={Colors.gray} style={{ marginRight: 4 }} />
          <Text style={styles.metaText}>{item.duration}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export const OrthoCarousel: FC<{ entries: MediaItem[] | undefined; onSelect: (item: MediaItem) => void }> = ({ entries, onSelect }) => {
  if (isWeb) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.webScrollContent}
        style={styles.webScrollView}
      >
        {entries?.map((item) => (
          <CarousselCard key={item.id_content} item={item} onPress={() => onSelect(item)} />
        ))}
      </ScrollView>
    );
  }

  return (
    <View style={styles.mobileContainer}>
      {entries?.map((item) => (
        <CarousselCard key={item.id_content} item={item} onPress={() => onSelect(item)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Container
  webScrollView: {
    marginLeft: Spacings.lg,
  },
  webScrollContent: {
    paddingBottom: Spacings.md,
    flexDirection: 'row',
  },
  mobileContainer: {
    width: '100%',
  },

  // WEB STYLES (New Layout)
  cardWeb: {
    width: 260,
    height: 240,
    backgroundColor: Colors.white,
    marginRight: Spacings.md,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.line
  },
  imageContainerWeb: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  detailWeb: {
    padding: Spacings.sm,
    flex: 1,
  },

  // MOBILE STYLES (Original Layout)
  cardMobile: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: Spacings.lg,
    marginVertical: Spacings.xs,
  },
  imageContainerMobile: {
    width: 120,
    height: 80,
  },
  thumbnailMobile: {
    width: 120,
    height: 80,
    resizeMode: 'cover',
    borderRadius: 8,
  },
  detailMobile: {
    flex: 1,
    paddingLeft: Spacings.sm,
    justifyContent: 'center',
  },
  metaRowMobile: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Common Typography
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  author: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    fontFamily: 'Roboto',
  },
  metaText: {
    fontSize: 11,
    color: Colors.gray,
  },
  title: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
});