import React, { useState, useCallback, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  StatusBar,
  RefreshControl,
  SafeAreaView,
  InteractionManager,
  TouchableOpacity,
  Image,
  FlatList
} from 'react-native';

import { useQuery, useInfiniteQuery } from "@tanstack/react-query"
import { fetchMedias } from '../../services/FlashMediasService';
import {
  fetchFeedCategories,
  fetchFeedsFromCategory,
  fetchLikedArticles
} from "../../services/FeedService";
import { FeedDisplayer, FeedHeader, LIKE_CATEGORY_ID } from './components/Feed';
import { OrthoCarousel } from '../../component/OrthoCarousel'
import { HomeHeader } from './HomeHeader';

import { getContentById } from '../../services/ContentService';
import { getUserRegisteredFormation } from '../../services/FormationService';
import { useGetUser } from '../../hooks/useGetUser.hook';
import { navigate } from '../../navigation/RootNavigation';

import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { Feather } from '@expo/vector-icons';

const Colors = require('../../constants/Colors');
const Styles = require('../../constants/Styles');

export const HomeView = ({ navigation, route }) => {

  const { data: user, ...userQuery } = useGetUser()
  const [refreshing, setRefreshing] = useState(false);
  const flashPreview = useQuery({
    queryKey: ["flash-preview"], queryFn: () => fetchMedias({
      limit: 10,
    })
  });

  const [selectedFeedCategoryId, setSelectedFeedCategoryId] = useState(1)
  const [scrollReachedEnd, setScrollReachedEnd] = useState(false)
  const feedCategories = useQuery({ queryKey: ["GET", "categories", "feed"], queryFn: () => fetchFeedCategories() })
  const [allFeed, setAllFeed] = useState([])
  const {
    data: articles,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
    refetch
  } = useInfiniteQuery({
    queryKey: ['feed', selectedFeedCategoryId],
    queryFn: fetchFeedsFromCategory,
    getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
    onSettled: () => {
      setScrollReachedEnd(false)
    }
  })

  const savedArticles = useQuery({ queryKey: ["GET", "liked", "feed"], queryFn: () => fetchLikedArticles() })
  // const copilote = useCopilot()

  const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
    const paddingToBottom = 20;
    return layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    flashPreview.refetch(0, 5)
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);


  const handleOpenContent = async (id) => {
    getContentById(id)
      .then((content) => {
        if (content.type == "lesson") {
          getUserRegisteredFormation({
            idUserFormation: 0
          }).then((formations) => {
            if (formations && Array.isArray(formations)) {
              const currentFormation = formations.filter((f) => f.id_formation === content.id_formation)

              navigation.navigate('home-content', {
                "content": content,
                "formation": currentFormation[0],
                "type": "lesson",
                "demoMode": !currentFormation[0].certifying && !currentFormation[0].is_paid && !user.is_student
              })

            }
          })
        } else {
          navigate('Médias', {
            screen: 'flash-media-home',
          });

          InteractionManager.runAfterInteractions(() => {
            navigate('flash-media-preview', {
              media: content,
              type: "flash"
            });
          });
        }
      })
  }

  const tmpAsyn = async () => {
  }

  useEffect(() => {
    tmpAsyn()
    if (route.path && route.path.includes("open/content/")) {
      if (route.params && route.params.id) {
        handleOpenContent(route.params.id)
      }
    }
  }, [route.params])


  useEffect(() => {
    if (scrollReachedEnd) {
      if (hasNextPage && isFetching == false) {
        fetchNextPage()
      }
    }
  }, [scrollReachedEnd])

  /**
   * Course card layout
   * @author Francis
   */
  const CourseCard = ({ title, courseDetail }) => {
    return (
      <TouchableOpacity style={styles.courseCard}>
        <View style={styles.courseImageContainer}>
          <View style={styles.coursePlaceholder}>
            <Feather name="image" size={40} color={Colors.gray} />
          </View>
        </View>
        <Text numberOfLines={1} ellipsizeMode='tail' style={styles.courseTitle}>{title}</Text>
        <Text numberOfLines={1} ellipsizeMode='tail' style={styles.courseDetail}>{courseDetail}</Text>
      </TouchableOpacity>
    )
  };

  // Get newest flashes
  const newestVideos = useQuery({
    queryKey: ["newest-videos"], queryFn: () => fetchMedias({
      limit: 7,
      orderBy: "created DESC"
    })
  });

  /**
   * Video card layout
   * @author Francis
   */
  const VideoCard = ({ title, author }) => {
    return (
      <TouchableOpacity style={styles.videoCard}>
        <View style={styles.videoImageContainer}>
          <View style={styles.videoPlaceholder}>
            <Feather name="image" size={40} color={Colors.gray} />
          </View>
        </View>
        <Text numberOfLines={2} ellipsizeMode='tail' style={styles.videoTitle}>{title}</Text>
        <Text numberOfLines={1} ellipsizeMode='tail' style={styles.videoDetail}>{author}</Text>
      </TouchableOpacity>
    )
  };

  const SkeletonItem = () => (
    <View style={styles.skeletonItem}>
      <View style={styles.skeletonText} />
    </View>
  );

  /**
   * Handle load newest videos
   */
  const [loadingVideos, setLoadingVideos] = useState(true);

  useEffect(() => {
    if (newestVideos && newestVideos.data) {
      setLoadingVideos(false);
    }
  }, [newestVideos])

  return (
    <>
      <StatusBar animated={true} barStyle={'dark-content'} />
      <View style={[Styles.container, styles.paddingTopSafeArea]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour</Text>
            <Text numberOfLines={1} ellipsizeMode='tail' style={styles.userName}>{user.name}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.avatarContainner}
              onPress={() => navigation.navigate('Mon espace')}
            >
              {/* TODO: Load real avatar */}
              <Image style={styles.avatar}
                src={'https://ui-avatars.com/api/?name=' + user.name + '&background=FB6D3A&color=ffffff&size=50'}></Image>
            </TouchableOpacity>
          </View>
        </View>

        {/* Body */}
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Quiz Card */}
          <TouchableOpacity
            style={styles.cardSection}
          >
            <View style={styles.quizCard}>
              <Text style={styles.quizTitle}>Le Quiz de bienvenue</Text>
              <View style={styles.quizBody}>
                <Text style={styles.quizContent}>Évaluer ton niveau de connaissance et de réfléxion actuel</Text>
                <View style={styles.quizIconContainer}>
                  <Feather name="arrow-right" size={20} color={Colors.white} />
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Proposed courses */}
          <View style={styles.sectionContainer}>
            <View style={Styles.sectionHeader}>
              <Text style={Styles.sectionTitle}>Les médias</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Médias')}>
                <Text style={Styles.seeAllButton}>Voir plus</Text>
              </TouchableOpacity>
            </View>
          </View>

          {loadingVideos
            ?
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.courseScrollView}
            >
              {[...Array(6)].map((_, index) => (
                <SkeletonItem key={index} />
              ))}
            </ScrollView>
            :
            <FlatList
              horizontal
              data={newestVideos.data}
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id_content.toString()}
              style={{ paddingStart: 8 }}
              renderItem={({ item }) => (
                <VideoCard
                  title={item.title}
                  author={item.author}
                  image={null}
                />
              )}
            />
          }
        </ScrollView>
      </View>



      <ScrollView style={{ backgroundColor: '#fff', flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        stickyHeaderIndices={[2]}
        onScroll={({ nativeEvent }) => {
          if (isCloseToBottom(nativeEvent)) {
            if (isFetching == false && hasNextPage && scrollReachedEnd == false)
              setScrollReachedEnd(true)
          }
        }}

        scrollEventThrottle={800}
      >
        <HomeHeader navigation={navigation} />

        <View style={styles.carouselContainer}>
          <View style={styles.carouselHeader}>

            <Text style={styles.carouselHeaderTitle}>Nos derniers contenus</Text>
            <Pressable style={styles.carouselHeaderButton} onPress={() => navigation.navigate('Médias')}>
              <Text style={[styles.carouselHeaderButtonText, { color: "#ffaf31" }]}>Voir tous</Text>
            </Pressable>
          </View>
          <OrthoCarousel entries={flashPreview.data} onSelect={(content) => {
            navigate('Médias', {
              screen: 'flash-media-home',
            });

            InteractionManager.runAfterInteractions(() => {
              navigate('flash-media-preview', {
                media: content,
                type: "flash"
              });
            });
          }} />
        </View>

        <SafeAreaView style={{ backgroundColor: "#E3E3F1" }}>
          <FeedHeader
            categories={feedCategories.data}
            isLoading={feedCategories.isLoading}
            onCategorySelect={(id) => {
              setSelectedFeedCategoryId(id)
              setAllFeed([])
            }}
            selectedFeedCategoryId={selectedFeedCategoryId}
            nbSavedArticle={savedArticles.data?.length}
          />
        </SafeAreaView>
        {
          selectedFeedCategoryId == LIKE_CATEGORY_ID &&
          <FeedDisplayer
            feed={savedArticles.data}
            onLikeOrDislike={() => { savedArticles.refetch() }}
          />

        }
        {
          selectedFeedCategoryId != LIKE_CATEGORY_ID &&
          articles?.pages?.map((value, index) => {
            return <FeedDisplayer
              key={index}
              feed={value.data}
              onLikeOrDislike={() => { savedArticles.refetch() }}
            />
          })
        }
      </ScrollView>
    </>
  );
}


const styles = StyleSheet.create({
  carouselContainer: {
    marginVertical: 40
  },
  carouselHeader: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 5
  },
  carouselHeaderTitle: {
    flex: 2,
    alignSelf: 'flex-start',
    marginLeft: 5,
    fontSize: 15,
  },
  carouselHeaderButton: {
    flex: 1,
    alignItems: 'flex-end',

  },
  carouselHeaderButtonText: {
    fontWeight: '600',
    fontSize: 14,
    marginEnd: 15
  },
  notificationIndicator: {
    backgroundColor: 'red',
    width: 10,
    height: 10,
    borderRadius: 100,
    position: 'absolute',
    alignSelf: 'flex-end'
  },


  // Francis
  paddingTopSafeArea: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
  },
  // Header
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 24,
    marginTop: Platform.OS === "android" ? 32 : 64
  },
  avatarContainner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: Colors.primary,
    padding: 2
  },
  avatar: {
    width: 35,
    height: 35,
    borderRadius: 20
  },
  greeting: {
    fontSize: 16,
    fontFamily: 'Roboto',
    color: Colors.gray,
    marginBottom: -5
  },
  userName: {
    fontSize: 22,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },

  // Card
  cardSection: {
    paddingHorizontal: 24,
    marginVertical: 16,
  },
  quizCard: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
  },
  quizTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    marginBottom: 4,
  },
  quizBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quizContent: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.grayLight,
    lineHeight: 20,
    width: '80%',
  },
  quizIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Section
  sectionContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  courseScrollView: {
    paddingLeft: 0,
  },

  // Course
  courseCard: {
    width: 160,
    marginLeft: 24,
  },
  courseImageContainer: {
    marginBottom: 8,
  },
  coursePlaceholder: {
    width: 160,
    height: 120,
    borderRadius: 8,
    backgroundColor: Colors.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseTitle: {
    fontSize: 14,
    fontFamily: 'Roboto',
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 20
  },
  courseDetail: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Roboto',
    color: Colors.gray,
    marginBottom: 4,
  },

  // Video
  videoCard: {
    width: 200,
    marginLeft: 16,
  },
  videoImageContainer: {
    marginBottom: 12,
  },
  videoPlaceholder: {
    width: 200,
    height: 120,
    borderRadius: 8,
    backgroundColor: Colors.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoTitle: {
    fontSize: 14,
    fontFamily: 'Roboto',
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 14,
    height: 28,
  },
  videoDetail: {
    fontSize: 11,
    fontFamily: 'Poppins-Light',
    color: Colors.gray,
  },

  // Skeleton
  skeletonItem: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  skeletonText: {
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    width: '80%',
  },

})

