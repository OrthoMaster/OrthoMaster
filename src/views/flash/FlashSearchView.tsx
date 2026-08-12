import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  Platform,
  Modal,
  Keyboard,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from "@tanstack/react-query"

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import { getPreSearch, search, deleteKeyword, clearSearchHistory } from '../../services/v2/ContentService';

const { width, height } = Dimensions.get('window');
const isTablet = Platform.OS !== 'web' && width >= 768;

interface Video {
  id?: string;
  id_content?: string;
  title: string;
  duration: string;
  version?: string;
  type?: string;
  author?: string;
  aws_object_path?: string;
  s3_path?: string;
  thumbnail?: string;
}

interface SearchSuggestion {
  id: string;
  keyword: string;
}

export const FlashSearchView = ({ navigation }) => {
  // Hide bottom nav
  useEffect(() => {
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: 'none' }
    });

    return () => {
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'flex' }
      });
    };
  }, [navigation]);

  const { data: preData, isLoading: isLoadingPreData, isFetching, isError: isErrorPreData, refetch: refetchPreData } = useQuery({
    queryKey: ['pre-search'],
    queryFn: () => getPreSearch(),
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: 2,
    retryDelay: 2000
  });

  // State management
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('video');
  const [isLoading, setIsLoading] = useState(false);

  // Search Results States
  const [videos, setVideos] = useState<Video[]>([]);

  // Pagination States
  const [videosPage, setVideosPage] = useState(1);
  const [hasMoreVideos, setHasMoreVideos] = useState(false);
  const [isLoadingMoreVideos, setIsLoadingMoreVideos] = useState(false);

  const [filteredHistorySuggestions, setFilteredHistorySuggestions] = useState<SearchSuggestion[]>([]);
  const [filteredTrendingSuggestions, setFilteredTrendingSuggestions] = useState<SearchSuggestion[]>([]);

  useEffect(() => {
    setFilteredHistorySuggestions(preData?.histories || []);
    setFilteredTrendingSuggestions(preData?.trending || []);
  }, [preData]);

  // Handle submit
  const handleSubmit = () => {
    handleSearch(searchQuery, selectedCategory);
  }

  // Handle search - only triggered by keyboard submit or suggestion click
  const handleSearch = async (query?: string, category?: string) => {
    const searchText = query || searchQuery;
    const searchCategory = category || selectedCategory;

    if (!searchText.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    // Reset data và pages
    setVideos([]);
    setVideosPage(1);

    const response = await search(searchText, searchCategory, 1, 1);

    if (response === false) {
      setVideos([]);
      setIsLoading(false);
      setIsSearching(false);
      return;
    }

    // Update videos
    if (response.results?.videos) {
      setVideos(response.results.videos.data || []);
      setHasMoreVideos(response.results.videos.has_more || false);
    }

    setIsSearching(false);
  };

  // Load more videos
  const loadMoreVideos = async () => {
    if (!hasMoreVideos || isLoadingMoreVideos || isLoading) return;

    setIsLoadingMoreVideos(true);
    const nextPage = videosPage + 1;

    const response = await search(searchQuery, selectedCategory, 1, nextPage);

    if (response !== false && response.results?.videos) {
      setVideos(prev => [...prev, ...response.results.videos.data]);
      setHasMoreVideos(response.results.videos.has_more);
      setVideosPage(nextPage);
    }

    setIsLoadingMoreVideos(false);
  };

  // Handle search text change
  const handleTextChange = (text: string) => {
    setSearchQuery(text);

    if (text.trim() === '' && hasSearched) {
      setHasSearched(false);
      setVideos([]);
      setSelectedCategory('video');
      setVideosPage(1);
      refetchPreData();
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestionText: string) => {
    setSearchQuery(suggestionText);
    handleSearch(suggestionText);
    Keyboard.dismiss();
  };

  // Handle remove single suggestion from history
  const handleRemoveSuggestion = (suggestionId: string) => {
    setFilteredHistorySuggestions(prev => prev.filter(s => s.id !== suggestionId));
    deleteKeyword(suggestionId);
  };

  // Handle clear all history
  const handleClearHistory = () => {
    setFilteredHistorySuggestions([]);
    clearSearchHistory();
  };

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    handleSearch(searchQuery, categoryId);
  };

  // Clear search
  const handleClearSearch = async () => {
    setSearchQuery('');
    setHasSearched(false);
    setVideos([]);
    setSelectedCategory('video');
    setVideosPage(1);

    await refetchPreData();
  };

  // Render video item
  const renderVideoItem = ({ item }: { item: Video }) => (
    <TouchableOpacity
      style={styles.videoItem}
      activeOpacity={0.7}
      onPress={() => {
        navigation.navigate('media', {
          screen: 'flash-media-preview',
          params: {
            media: item,
          },
        });
      }}
    >
      <View style={styles.thumbnailContainer}>
        {(item.s3_path) ?
          <Image
            source={{ uri: item.thumbnail }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
          : <MaterialCommunityIcons name="play-circle" size={50} color={Colors.grayLight} />
        }
      </View>

      <View style={styles.videoInfo}>
        <Text style={styles.description} numberOfLines={1} ellipsizeMode='tail'>
          {item.author ?? 'OrthoMaster'}
        </Text>
        <Text style={styles.videoTitle} numberOfLines={2} ellipsizeMode='tail'>
          {item.title}
        </Text>
      </View>
    </TouchableOpacity >
  );

  // Render video grid (2 columns for tablet always)
  const renderVideoGrid = () => {
    if (!isTablet) {
      // Single column for phone
      return (
        <FlatList
          data={videos}
          renderItem={renderVideoItem}
          keyExtractor={(item) => `video-${item.id_content}-${item.id}`}
          scrollEnabled={false}
        />
      );
    }

    // 2 columns for tablet
    const rows: (Video | null)[][] = [];
    for (let i = 0; i < videos.length; i += 2) {
      rows.push([
        videos[i],
        videos[i + 1] || null
      ]);
    }

    return (
      <>
        {rows.map((row, rowIndex) => (
          <View key={`video-row-${rowIndex}`} style={styles.gridRow}>
            {row.map((item, colIndex) =>
              item ? (
                <View key={`${item.id_content}-${item.id}`} style={styles.gridColumnVideo}>
                  {renderVideoItem({ item })}
                </View>
              ) : (
                <View key={`empty-video-${colIndex}`} style={styles.gridColumnVideo} />
              )
            )}
          </View>
        ))}
      </>
    );
  };

  // Render "Load More" button
  const renderLoadMoreButton = (hasMore: boolean, isLoading: boolean, onPress: () => void) => {
    if (!hasMore) return null;

    return (
      <TouchableOpacity
        style={styles.loadMoreButton}
        onPress={onPress}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.greenDark} />
        ) : (
          <>
            <Text style={styles.loadMoreText}>Voir plus</Text>
            <Ionicons name="chevron-down" size={20} color={Colors.redDark} />
          </>
        )}
      </TouchableOpacity>
    );
  };

  // Render suggestion item - HISTORY
  const renderHistorySuggestionItem = (suggestion: SearchSuggestion) => (
    <TouchableOpacity
      key={suggestion.id}
      style={styles.suggestionItem}
      onPress={() => handleSuggestionClick(suggestion.keyword)}
      activeOpacity={0.7}
    >
      <Ionicons
        name="time-outline"
        size={20}
        color={Colors.gray}
      />
      <Text style={styles.suggestionText}>{suggestion.keyword}</Text>
      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          handleRemoveSuggestion(suggestion.id);
        }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close" size={20} color={Colors.gray} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Render suggestion item - TRENDING
  const renderTrendingSuggestionItem = (suggestion: SearchSuggestion) => (
    <TouchableOpacity
      key={suggestion.id}
      style={styles.suggestionItem}
      onPress={() => handleSuggestionClick(suggestion.keyword)}
      activeOpacity={0.7}
    >
      <Ionicons
        name="trending-up-outline"
        size={20}
        color={Colors.gray}
      />
      <Text style={styles.suggestionText}>{suggestion.keyword}</Text>
      <Ionicons
        name="arrow-forward-outline"
        size={16}
        color={Colors.gray}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={styles.container}
      edges={Platform.OS === 'android' ? ['top', 'left', 'right', 'bottom'] : ['top', 'left', 'right']}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.red} />
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>

          <Image
            style={isTablet ? styles.searchIconTablet : styles.searchIcon}
            source={require('../../../assets/v2_images/icon/home/search.gif')}
          />

          <View style={{ width: Spacings.xxl }}></View>
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.searchTitle}>Chercher un média</Text>
          <Text style={styles.searchSubTitle}>par mot clé, nom d'expert ou du congrès ...</Text>
        </View>
        <View style={styles.headerBottom}>
          {/* Search Bar */}
          <View style={styles.searchBarContainer}>
            <Ionicons name="search-outline" size={20} color={Colors.gray} />
            <TextInput
              autoCapitalize="none"
              style={styles.searchInput}
              placeholder="Chercher un média ..."
              value={searchQuery}
              onChangeText={handleTextChange}
              onSubmitEditing={handleSubmit}
              placeholderTextColor={Colors.gray}
              returnKeyType="search"
              maxLength={50}
            />
            {/* Clear button */}
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch} style={styles.clearIconButton}>
                <Ionicons name="close" size={20} color={Colors.gray} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {!hasSearched ? (
          // Suggestions View
          !isLoadingPreData && (
            <ScrollView
              style={styles.suggestionsContainer}
              showsVerticalScrollIndicator={false}
            >
              {searchQuery.length > 0 ? (
                <>
                  {filteredHistorySuggestions.length > 0 && (
                    <>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recherches récentes</Text>
                      </View>
                      {filteredHistorySuggestions.map(renderHistorySuggestionItem)}
                    </>
                  )}

                  {filteredTrendingSuggestions.length > 0 && (
                    <>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Tendances</Text>
                      </View>
                      {filteredTrendingSuggestions.map(renderTrendingSuggestionItem)}
                    </>
                  )}
                </>
              ) : (
                <>
                  {filteredHistorySuggestions.length > 0 && (
                    <>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recherches récentes</Text>
                        <TouchableOpacity
                          onPress={handleClearHistory}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={styles.clearButton}>Effacer</Text>
                        </TouchableOpacity>
                      </View>
                      {filteredHistorySuggestions.map(renderHistorySuggestionItem)}
                    </>
                  )}

                  {filteredTrendingSuggestions.length > 0 && (
                    <>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Tendances</Text>
                      </View>
                      {filteredTrendingSuggestions.map(renderTrendingSuggestionItem)}
                    </>
                  )}
                </>
              )}
            </ScrollView>
          )
        ) : (
          // Search Results View
          <>
            {isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.greenDark} />
                <Text style={styles.loadingText}>Recherche en cours...</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.resultsScrollView}
                showsVerticalScrollIndicator={false}
              >
                {/* Videos Section */}
                {(selectedCategory === 'all' || selectedCategory === 'video') && videos.length > 0 && (
                  <View style={styles.resultSection}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.resultSectionTitle}>
                        Médias
                      </Text>
                    </View>
                    {renderVideoGrid()}
                    {renderLoadMoreButton(hasMoreVideos, isLoadingMoreVideos, loadMoreVideos)}
                  </View>
                )}

                {/* Empty State */}
                {videos.length === 0 && (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="search-outline" size={80} color={Colors.gray} />
                    <Text style={styles.emptyText}>Aucun résultat trouvé</Text>
                    <Text style={styles.emptySubtext}>
                      Essayez d'autres mots-clés
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.red,
  },
  header: {
    backgroundColor: Colors.white,
  },
  headerTop: {
    backgroundColor: Colors.red,
    paddingTop: Spacings.sm,
    paddingBottom: Spacings.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerCenter: {
    backgroundColor: Colors.red,
    paddingHorizontal: Spacings.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Spacings.md
  },
  headerBottom: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.xxs,
    backgroundColor: Colors.red,
    paddingBottom: Spacings.lg,
    borderBottomEndRadius: 24,
    borderBottomStartRadius: 24,
    paddingHorizontal: Spacings.lg,
  },
  backButton: {
    padding: 4,
    paddingRight: Spacings.md,
    paddingLeft: Spacings.lg
  },
  searchIcon: {
    width: 60,
    height: 60,
  },
  searchIconTablet: {
    width: 100,
    height: 100,
    marginTop: Spacings.lg,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingLeft: Spacings.md,
    paddingVertical: Spacings.sm,
    borderRadius: 12,
    gap: Spacings.sm,
  },
  searchTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
  },
  searchSubTitle: {
    fontSize: 14,
    fontFamily: 'Roboto',
    color: Colors.white,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
    paddingVertical: 0,
  },
  clearIconButton: {
    paddingRight: Spacings.md,
  },

  // Categories
  categoriesContainer: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    paddingVertical: Spacings.sm,
  },
  categoriesContent: {
    paddingHorizontal: Spacings.lg,
    gap: Spacings.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.xs,
    borderRadius: 20,
    backgroundColor: Colors.grayLight,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  categoryChipActive: {
    backgroundColor: Colors.greenDark,
    borderColor: Colors.greenDark,
  },
  categoryChipText: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  categoryChipTextActive: {
    color: Colors.white,
  },

  // Content
  content: {
    flex: 1,
    backgroundColor: Colors.grayLight,
  },

  // Suggestions
  suggestionsContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingBottom: Spacings.xxxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacings.lg,
    marginTop: Spacings.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: Colors.subtext,
    paddingTop: Spacings.sm,
    paddingBottom: Spacings.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearButton: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: Colors.red,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    gap: Spacings.md,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
  },

  // Search Results
  resultsScrollView: {
    flex: 1,
  },
  resultSection: {
    marginBottom: Spacings.lg,
  },
  resultSectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: Colors.redDark,
    paddingVertical: Spacings.sm,
  },

  // Grid Layout
  gridRow: {
    flexDirection: 'row',
    gap: Spacings.md,
    paddingHorizontal: Spacings.lg,
  },
  gridColumnLesson: {
    flex: 1,
  },
  gridColumnVideo: {
    flex: 1,
  },

  // Video Item
  videoItem: {
    backgroundColor: Colors.white,
    marginBottom: Spacings.md,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: isTablet ? 0 : Spacings.lg,
  },
  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.gray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  durationBadge: {
    position: 'absolute',
    bottom: Spacings.xs,
    right: Spacings.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: Spacings.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
  videoInfo: {
    padding: Spacings.md,
  },
  videoTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    lineHeight: 18,
    marginBottom: Spacings.xs,
    minHeight: isTablet ? 36 : 18,
  },
  videoMeta: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    lineHeight: 16,
    marginBottom: Spacings.xs,
  },
  description: {
    fontSize: 12,
    fontFamily: 'Roboto',
    fontWeight: '500',
    color: Colors.primary,
    lineHeight: 16,
    marginBottom: Spacings.xxs,
  },

  // Footer Loading
  footerLoading: {
    paddingVertical: Spacings.md,
    alignItems: 'center',
  },

  // Load More Button
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.lg,
    marginHorizontal: Spacings.lg,
    marginTop: Spacings.sm,
    marginBottom: Spacings.md,
    backgroundColor: Colors.red3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.redDark,
    gap: Spacings.xs,
  },
  loadMoreText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.redDark,
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacings.xxl,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    marginTop: Spacings.md,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacings.xxl,
    paddingHorizontal: Spacings.xl,
    minHeight: 400,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    marginTop: Spacings.md,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    marginTop: Spacings.xs,
    textAlign: 'center',
  },
});