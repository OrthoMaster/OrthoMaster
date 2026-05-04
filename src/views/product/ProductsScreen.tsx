import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { FilterSummaryModal } from './components/FilterSummaryModal';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';

import { Selections } from './lib/Logic';
import { matchProducts, MOCK_PRODUCTS, Product } from './lib/Products';
import { SAMPLE_NODES } from './lib/SampleData';
import { palette } from './lib/Theme';


export const ProductsScreen = ({ navigation, route }) => {
  // Pathology filters chosen on SolarFilterScreen, passed via route param.
  const selections: Selections = route?.params?.selections ?? {};

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  const products = useMemo(
    // () => matchProducts(MOCK_PRODUCTS, selections),
    // [selections],
    () => MOCK_PRODUCTS
  );

  const totalSelected = Object.values(selections).reduce(
    (s, a) => s + a.length,
    0,
  );

  const onBack = () => navigation.goBack();

  const handleResetFilters = () => {
    setSummaryOpen(false);
    // Pop back to the filter screen and ask it to clear via route param.
    // SolarFilterScreen has a useEffect listening for `reset: true`.
    navigation.navigate('new-que-choisir', { reset: true });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.bg} />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backBtn}
            hitSlop={10}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={palette.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.title} numberOfLines={1}>
            Products
          </Text>

          <View style={{ flex: 1 }} />

          <TouchableOpacity
            style={[styles.filterBtn, totalSelected === 0 && styles.filterBtnEmpty]}
            onPress={() => setSummaryOpen(true)}
            activeOpacity={0.85}
            disabled={totalSelected === 0}
          >
            <Ionicons
              name="options-outline"
              size={16}
              color={totalSelected === 0 ? palette.textMuted : '#FFFFFF'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.filterText,
                totalSelected === 0 && styles.filterTextEmpty,
              ]}
            >
              {totalSelected === 0
                ? 'No filters'
                : `${totalSelected} filter${totalSelected > 1 ? 's' : ''}`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Result count banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            {products.length === 0
              ? 'No products match your filters'
              : `${products.length} product${products.length > 1 ? 's' : ''} found`}
          </Text>
        </View>

        {/* List */}
        {products.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={36} color={palette.textMuted} />
            <Text style={styles.emptyTitle}>No matches</Text>
            <Text style={styles.emptySub}>
              Adjust your pathology filters to see results.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={onBack}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyBtnText}>Back to filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={p => p.id}
            renderItem={({ item }) => (
              <ProductCard
                product={item}
                onPress={() => setDetailProduct(item)}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>

      {/* Modals */}
      <FilterSummaryModal
        visible={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        onReset={handleResetFilters}
        nodes={SAMPLE_NODES}
        selections={selections}
      />

      <ProductDetailModal
        visible={!!detailProduct}
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: palette.cardBg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.textPrimary,
    letterSpacing: -0.3,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  filterBtnEmpty: {
    backgroundColor: palette.bg,
    borderWidth: 1.5,
    borderColor: palette.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  filterText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  filterTextEmpty: {
    color: palette.textMuted,
    fontWeight: '600',
  },

  banner: {
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  bannerText: {
    fontSize: 12,
    color: palette.textSecondary,
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 24,
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
    marginTop: 14,
  },
  emptySub: {
    fontSize: 13,
    color: palette.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyBtn: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: palette.fabBg,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});