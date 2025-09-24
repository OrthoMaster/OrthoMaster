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
  InteractionManager
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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


export const HomeView = ({ navigation, route }) => {

  const { data: user, ...userQuery } = useGetUser()
  const [refreshing, setRefreshing] = useState(false);
  const flashPreview = useQuery({
    queryKey: ["flash-preview"], queryFn: () => fetchMedias({
      limit: 10
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

  return (
    <View style={{ flex: 1 }}>
      <StatusBar
        animated={true}
        barStyle={Platform.OS === "android" ? 'light-content' : 'dark-content'}
        backgroundColor={"#000"}
      />
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


    </View>
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

})

