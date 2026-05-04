import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Product } from '../lib/Products';
import { palette } from '../lib/Theme';

type ProductCardProps = {
  product: Product;
  onPress: () => void;
};

export function ProductCard({ product, onPress }: ProductCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <Image
        source={{ uri: product.images[0] }}
        style={styles.image}
        resizeMode="cover"
      />

      <View style={styles.info}>
        <Text style={styles.manufacturer} numberOfLines={1}>
          {product.manufacturer}
        </Text>
        <Text style={styles.category} numberOfLines={1}>
          {product.category}
        </Text>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.footer}>
          <Pressable onPress={onPress} hitSlop={6} style={styles.detailsBtn}>
            <Text style={styles.detailsText}>View details</Text>
            <Ionicons name="arrow-forward" size={14} color={palette.textPrimary} style={{ marginLeft: 4 }} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const CARD_HEIGHT = 130;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: palette.cardBg,
    borderRadius: 14,
    overflow: 'hidden',
    height: CARD_HEIGHT,
    marginBottom: 12,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: palette.border,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  image: {
    width: CARD_HEIGHT,
    height: CARD_HEIGHT,
    backgroundColor: '#F3F0EA',
  },
  info: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  manufacturer: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  category: {
    fontSize: 11.5,
    fontWeight: '500',
    color: palette.textSecondary,
    marginTop: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textPrimary,
    letterSpacing: -0.2,
    marginTop: 4,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: palette.bg,
  },
  detailsText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.textPrimary,
    letterSpacing: 0.1,
  },
});