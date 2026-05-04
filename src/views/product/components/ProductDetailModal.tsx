import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
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
import { Product } from '../lib/Products';
import { palette } from '../lib/Theme';

type ProductDetailModalProps = {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
};

const TABS = [
  { key: 'general', label: 'General' },
  { key: 'sizes', label: 'Taille' },
  { key: 'contra', label: 'Contre-indications' },
  { key: 'advice', label: 'Conseil associé' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export function ProductDetailModal({ visible, product, onClose }: ProductDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [imageIndex, setImageIndex] = useState(0);
  const screenWidth = Dimensions.get('window').width;

  if (!product) return <Modal visible={false} transparent />;

  // Image width = modal width = screen width (modal is full-width)
  const IMAGE_W = screenWidth;
  const IMAGE_H = screenWidth;     // square

  const onImageScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const idx = Math.round(offsetX / IMAGE_W);
    if (idx !== imageIndex) setImageIndex(idx);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Image carousel — pinned to top, full width */}
          <View style={{ width: IMAGE_W, height: IMAGE_H }}>
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
                  style={{ width: IMAGE_W, height: IMAGE_H }}
                  resizeMode="cover"
                />
              )}
            />

            {/* Image counter — bottom right */}
            {product.images.length > 1 && (
              <View style={styles.counter}>
                <Text style={styles.counterText}>
                  {imageIndex + 1}/{product.images.length}
                </Text>
              </View>
            )}

            {/* Close button — top right, absolute over image */}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={10}
              activeOpacity={0.85}
            >
              <Ionicons name="close" size={22} color={palette.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Title strip below image */}
          <View style={styles.titleStrip}>
            <Text style={styles.manufacturer}>{product.manufacturer}</Text>
            <Text style={styles.name} numberOfLines={2}>
              {product.name}
            </Text>
            <Text style={styles.category}>{product.category}</Text>
          </View>

          {/* Tabs row */}
          <View style={styles.tabsBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsRow}
            >
              {TABS.map(t => {
                const active = activeTab === t.key;
                return (
                  <Pressable
                    key={t.key}
                    onPress={() => setActiveTab(t.key)}
                    style={[styles.tab, active && styles.tabActive]}
                  >
                    <Text style={[styles.tabText, active && styles.tabTextActive]}>
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Tab content (empty placeholder for now) */}
          <ScrollView
            style={styles.tabContent}
            contentContainerStyle={{ paddingVertical: 20, paddingHorizontal: 20 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.placeholderBox}>
              <Ionicons
                name="document-text-outline"
                size={28}
                color={palette.textMuted}
              />
              <Text style={styles.placeholderText}>
                {TABS.find(t => t.key === activeTab)?.label}
              </Text>
              <Text style={styles.placeholderSub}>
                Content coming soon.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
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
    height: '80%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    // No drag handle — per spec
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

  tabContent: {
    flex: 1,
  },
  placeholderBox: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
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
  },
});