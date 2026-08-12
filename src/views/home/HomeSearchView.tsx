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

interface Lesson {
  id: string;
  title: string;
  thumbnail: string;
  description: string;
  duration?: string;
  module?: any;
  image?: string;
}

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

interface Category {
  id: string;
  name: string;
}

interface SearchSuggestion {
  id: string;
  keyword: string;
}

export const HomeSearchView = ({ navigation }) => {
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Modal state
  const [lockedLessonModalVisible, setLockedLessonModalVisible] = useState(false);
  const [selectedLockedLesson, setSelectedLockedLesson] = useState<Lesson | null>(null);

  const [categories, setCategories] = useState<Category[]>([
    { id: 'all', name: 'Tout' },
    { id: 'lesson', name: 'Formations' },
    { id: 'video', name: 'Médias' },
  ]);

  // Search Results States
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);

  // Pagination States
  const [lessonsPage, setLessonsPage] = useState(1);
  const [videosPage, setVideosPage] = useState(1);
  const [hasMoreLessons, setHasMoreLessons] = useState(false);
  const [hasMoreVideos, setHasMoreVideos] = useState(false);
  const [isLoadingMoreLessons, setIsLoadingMoreLessons] = useState(false);
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
    setLessons([]);
    setVideos([]);
    setLessonsPage(1);
    setVideosPage(1);

    const response = await search(searchText, searchCategory, 1, 1);

    if (response === false) {
      setLessons([]);
      setVideos([]);
      setIsLoading(false);
      setIsSearching(false);
      return;
    }

    // Update lessons
    if (response.results?.lessons) {
      setLessons(response.results.lessons.data || []);
      setHasMoreLessons(response.results.lessons.has_more || false);
    }

    // Update videos
    if (response.results?.videos) {
      setVideos(response.results.videos.data || []);
      setHasMoreVideos(response.results.videos.has_more || false);
    }

    setIsSearching(false);
  };

  // Load more lessons
  const loadMoreLessons = async () => {
    if (!hasMoreLessons || isLoadingMoreLessons || isLoading) return;

    setIsLoadingMoreLessons(true);
    const nextPage = lessonsPage + 1;

    const response = await search(searchQuery, selectedCategory, nextPage, videosPage);

    if (response !== false && response.results?.lessons) {
      setLessons(prev => [...prev, ...response.results.lessons.data]);
      setHasMoreLessons(response.results.lessons.has_more);
      setLessonsPage(nextPage);
    }

    setIsLoadingMoreLessons(false);
  };

  // Load more videos
  const loadMoreVideos = async () => {
    if (!hasMoreVideos || isLoadingMoreVideos || isLoading) return;

    setIsLoadingMoreVideos(true);
    const nextPage = videosPage + 1;

    const response = await search(searchQuery, selectedCategory, lessonsPage, nextPage);

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
      setLessons([]);
      setVideos([]);
      setSelectedCategory('all');
      setLessonsPage(1);
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
    setLessons([]);
    setVideos([]);
    setSelectedCategory('all');
    setLessonsPage(1);
    setVideosPage(1);

    await refetchPreData();
  };

  // Handle open lesson
  const handleOpenLesson = async (item: Lesson, isActive: boolean) => {
    if (isActive) {
      navigation.navigate('lesson-content-xml', {
        lessonId: item.id,
        lessonTitle: item.title,
        trainingName: item.module.package.training.name,
      });
    } else {
      // Show modal for locked lesson
      setSelectedLockedLesson(item);
      setLockedLessonModalVisible(true);
    }
  }

  // Handle view package info
  const handleViewPackageInfo = () => {
    setLockedLessonModalVisible(false);
    if (selectedLockedLesson?.module) {
      navigation.goBack();
      navigation.navigate('training', {
        screen: 'training-list',
        initial: false,
        params: {
          initPackageId: selectedLockedLesson.module?.package?.id || null
        }
      });
    }
  };

  // Render lesson item
  const renderLessonItem = ({ item }: { item: Lesson }) => (
    <TouchableOpacity
      style={styles.courseItem}
      activeOpacity={0.7}
      onPress={() => {
        handleOpenLesson(item, preData.activePackageIds.includes(item.module?.package?.id));
      }}
    >
      <View style={[styles.courseCircle,
      {
        backgroundColor: item.module?.package?.training?.color || Colors.blueBackground,
      }]}>
        {item.image
          ? <View style={{ padding: Spacings.sm, width: '100%', height: '100%' }}>
            <Image
              source={{ uri: process.env.EXPO_PUBLIC_S3_URL + item.image }}
              style={styles.courseImage}
              resizeMode='contain'
            />
          </View>
          : <Text style={styles.courseIcon}>📚</Text>
        }

        {!preData.activePackageIds.includes(item.module?.package?.id) &&
          <View style={styles.clockOverlay}>
            <MaterialCommunityIcons name="lock" size={35} color={Colors.grayLight} />
          </View>
        }
      </View>

      <View style={styles.courseContainer}>
        <Text style={styles.courseTraining} numberOfLines={1} ellipsizeMode='tail'>{item.module?.package?.training?.name}</Text>
        <Text style={[styles.coursePackage, { color: item.module?.package?.training?.color || Colors.blue }]}
          numberOfLines={1} ellipsizeMode='tail'>{item.module?.package.short_name}</Text>
        <Text style={styles.courseName} numberOfLines={2} ellipsizeMode='tail'>{item.title}</Text>
      </View>
    </TouchableOpacity>
  );

  // Render lesson grid (2 columns for tablet when > 1 item)
  const renderLessonGrid = () => {
    if (!isTablet || lessons.length <= 1) {
      // Single column for phone or when there's only 1 item
      return (
        <FlatList
          data={lessons}
          renderItem={renderLessonItem}
          keyExtractor={(item) => `lesson-${item.id}`}
          scrollEnabled={false}
        />
      );
    }

    // 2 columns for tablet
    const rows: (Lesson | null)[][] = [];
    for (let i = 0; i < lessons.length; i += 2) {
      rows.push([
        lessons[i],
        lessons[i + 1] || null
      ]);
    }

    return (
      <>
        {rows.map((row, rowIndex) => (
          <View key={`lesson-row-${rowIndex}`} style={styles.gridRow}>
            {row.map((item, colIndex) =>
              item ? (
                <View key={item.id} style={styles.gridColumnLesson}>
                  {renderLessonItem({ item })}
                </View>
              ) : (
                <View key={`empty-lesson-${colIndex}`} style={styles.gridColumnLesson} />
              )
            )}
          </View>
        ))}
      </>
    );
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
            <Ionicons name="chevron-down" size={20} color={Colors.greenDark} />
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

  // Render Locked Lesson Modal
  const renderLockedLessonModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={lockedLessonModalVisible}
      onRequestClose={() => setLockedLessonModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalIconContainer}>
            <MaterialCommunityIcons name="lock" size={50} color={Colors.greenDark} />
          </View>

          <Text style={styles.modalTitle}>Contenu verrouillé</Text>

          <Text style={styles.modalMessage}>
            Cette leçon fait partie de la formation {' '}
            <Text style={styles.modalPackageName}>
              {selectedLockedLesson?.module?.package?.name}
            </Text>
            {' '}qui n'est pas encore activé.
          </Text>

          <Text style={styles.modalQuestion}>
            Souhaitez-vous consulter les informations sur cette formation ?
          </Text>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={() => setLockedLessonModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalButtonSecondaryText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={handleViewPackageInfo}
              activeOpacity={0.7}
            >
              <Text style={styles.modalButtonPrimaryText}>Voir le package</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView
      style={styles.container}
      edges={Platform.OS === 'android' ? ['top', 'left', 'right', 'bottom'] : ['top', 'left', 'right']}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.greenDark} />
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
          <Text style={styles.searchTitle}>Chercher un contenu</Text>
          <Text style={styles.searchSubTitle}>par mot clé, nom d'expert ou du congrès ...</Text>
        </View>
        <View style={styles.headerBottom}>
          {/* Search Bar */}
          <View style={styles.searchBarContainer}>
            <Ionicons name="search-outline" size={20} color={Colors.gray} />
            <TextInput
              autoCapitalize="none"
              style={styles.searchInput}
              placeholder="Chercher un contenu ..."
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

      {/* Categories - Only show after search */}
      {hasSearched && (
        <View style={styles.categoriesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && styles.categoryChipActive
                ]}
                onPress={() => handleCategorySelect(category.id)}
                activeOpacity={0.7}
                disabled={isSearching}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === category.id && styles.categoryChipTextActive
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

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
                {/* Lessons Section */}
                {(selectedCategory === 'all' || selectedCategory === 'lesson') && lessons.length > 0 && (
                  <View style={styles.resultSection}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.resultSectionTitle}>
                        Formations
                      </Text>
                    </View>
                    {renderLessonGrid()}
                    {renderLoadMoreButton(hasMoreLessons, isLoadingMoreLessons, loadMoreLessons)}
                  </View>
                )}

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
                {lessons.length === 0 && videos.length === 0 && (
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

      {/* Locked Lesson Modal */}
      {renderLockedLessonModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.greenDark,
  },
  header: {
    backgroundColor: Colors.white,
  },
  headerTop: {
    backgroundColor: Colors.greenDark,
    paddingTop: Spacings.sm,
    paddingBottom: Spacings.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerCenter: {
    backgroundColor: Colors.greenDark,
    paddingHorizontal: Spacings.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Spacings.md
  },
  headerBottom: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.xxs,
    backgroundColor: Colors.greenDark,
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
    color: Colors.greenDark,
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

  // Lesson
  courseItem: {
    flex: 1,
    marginHorizontal: isTablet ? 0 : Spacings.lg,
    marginBottom: Spacings.md,
    flexDirection: 'row',
  },
  courseCircle: {
    backgroundColor: Colors.blueBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    width: 90,
    minHeight: 90,
    overflow: 'hidden',
  },
  courseImage: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  courseIcon: {
    fontSize: 45,
  },
  courseContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    padding: Spacings.md
  },
  courseTraining: {
    fontSize: 12,
    fontFamily: 'Roboto',
    color: Colors.subtext,
  },
  coursePackage: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.greenDark,
    marginBottom: Spacings.xxs
  },
  courseName: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    minHeight: 30,
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
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.greenDark,
    gap: Spacings.xs,
  },
  loadMoreText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.greenDark,
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

  // Clocked
  clockOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100%',
    height: '100%'
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacings.xl,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacings.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacings.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: Colors.text,
    marginBottom: Spacings.md,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.subtext,
    textAlign: 'center',
    marginBottom: Spacings.md,
    lineHeight: 20,
  },
  modalPackageName: {
    fontFamily: 'Poppins-Bold',
    color: Colors.greenDark,
  },
  modalQuestion: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacings.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacings.md,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacings.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: Colors.greenDark,
    flex: 2,
  },
  modalButtonSecondary: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.greenDark,
  },
  modalButtonPrimaryText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
  modalButtonSecondaryText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.greenDark,
  },
});