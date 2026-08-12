import React, { FC } from 'react';
import {
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  View,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';

import AntDesign from '@expo/vector-icons/AntDesign';
import Colors from '../../constants/Colors';
import Spacings from '../../constants/Spacings';

export interface MediaItem {
  id_content: string | number;
  title: string;
  author: string;
  s3_path: string;
  duration: string;
  thumbnail: string;
  expert_names: string;
}

interface CarousselCardProps {
  item: MediaItem;
  onPress: () => void;
  imageWidth?: number;
}

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isTablet = Platform.OS !== 'web' && width >= 768;

const CarousselCard: FC<CarousselCardProps> = ({ item, onPress, imageWidth }) => {
  const imageHeight = imageWidth ? imageWidth * (9 / 16) : undefined;

  // --- VERSION WEB ---
  if (isWeb) {
    return (
      <TouchableOpacity style={styles.cardWeb} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.imageContainerWeb}>
          {item.thumbnail ? (
            <Image style={styles.thumbnail} source={{ uri: item.thumbnail }} />
          ) : (
            <View style={[styles.thumbnail, { backgroundColor: Colors.grayLight }]} />
          )}
        </View>
        <View style={styles.detailWeb}>
          <View style={styles.metaRow}>
            <Text style={styles.author} numberOfLines={1} ellipsizeMode='tail'>{item.expert_names ? item.expert_names : 'OrthoMaster'}</Text>
            <View style={styles.durationBadge}>
              <AntDesign name="clock-circle" size={10} color={Colors.gray} style={{ marginRight: 4 }} />
              <Text style={styles.metaText}>{item.duration}</Text>
            </View>
          </View>
          <Text style={styles.title} numberOfLines={2} ellipsizeMode='tail'>{item.title}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // --- VERSION MOBILE ---
  return (
    <TouchableOpacity
      style={[
        styles.cardMobileVertical,
        imageWidth && { width: imageWidth }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[
        styles.imageContainerMobile,
        imageWidth && imageHeight && { width: imageWidth, height: imageHeight }
      ]}>
        {item.thumbnail ? (
            <Image style={styles.thumbnail} source={{ uri: item.thumbnail }} />
        ) : (
          <View style={[styles.thumbnailMobile, { backgroundColor: Colors.grayLight }]} />
        )}
      </View>
      <View style={styles.detailMobile}>
        <View style={styles.metaRow}>
          <Text style={styles.author} numberOfLines={1}>{item.expert_names ? item.expert_names : 'OrthoMaster'}</Text>
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

  const horizontalPadding = Spacings.lg * 2; // padding trái phải
  const columnGap = Spacings.md; // khoảng cách giữa các cột

  let numColumns: number;
  let imageWidth: number;

  if (isTablet) {
    // iPad
    numColumns = 3;
    imageWidth = (width - horizontalPadding - (columnGap * (numColumns - 1))) / numColumns;
  } else {
    // iPhone
    numColumns = 1;
    imageWidth = (width - horizontalPadding - (columnGap * (numColumns - 1))) / numColumns;
  }

  // Chia entries thành các hàng theo số cột
  const rows: (MediaItem | null)[][] = [];
  for (let i = 0; i < (entries?.length || 0); i += numColumns) {
    const row: (MediaItem | null)[] = [];
    for (let j = 0; j < numColumns; j++) {
      row.push(entries?.[i + j] || null);
    }
    rows.push(row);
  }

  return (
    <ScrollView style={styles.mobileContainer} showsVerticalScrollIndicator={false}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.gridRow}>
          {row.map((item, colIndex) =>
            item ? (
              <View key={item.id_content} style={styles.gridColumn}>
                <CarousselCard
                  item={item}
                  onPress={() => onSelect(item)}
                  imageWidth={imageWidth}
                />
              </View>
            ) : (
              <View key={`empty-${colIndex}`} style={styles.gridColumn} />
            )
          )}
        </View>
      ))}
    </ScrollView>
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

  // WEB STYLES
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

  // MOBILE STYLES
  cardMobileVertical: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.line,
    marginBottom: Spacings.md,
  },
  imageContainerMobile: {
    width: '100%',
  },
  thumbnailMobile: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  detailMobile: {
    padding: Spacings.sm,
  },

  // GRID LAYOUT (2 cols iPhone, 3 cols iPad)
  gridRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacings.lg,
    gap: Spacings.md,
  },
  gridColumn: {
    flex: 1,
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
    fontWeight: '500',
    fontFamily: 'Roboto',
  },
  metaText: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
  },
  title: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    minHeight: isTablet ? 40 : 20,
  },
});