import React, { useState, useEffect, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  Pressable,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Platform,
  Linking,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useQuery } from "@tanstack/react-query"
import { fetchMedias } from '../../services/FlashMediasService';
import { OrthoCarousel } from '../../component/OrthoCarousel'
import { HomeHeader } from './HomeHeader';

import { IContent } from '../../utils/interfaces';

import MediaSkeleton from '../../views/media/components/MediaSkeleton';
import { BouncingDots } from '../../component/LoadingDots';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import { useGetUser } from '../../hooks/auth.hook';

import { DailyQuestionModal } from './components/DailyQuestionModal';
import { getDailyAction } from '../../services/v2/ContentService';

import { PodcastPlayerModal } from './components/PodcastPlayerModal';


export const HomeView = ({ navigation, route }) => {
  const actionChangeScreen = route.parame?.action ?? null;

  /** Get user */
  const { data: user } = useGetUser();

  /** Videos */
  const { data: videoData, isLoading: isLoadingVideo, isFetching: isFetchingVideo, isError: isErrorVideo, refetch: refetchVideos } = useQuery({
    queryKey: ['flash-preview'],
    queryFn: () =>
      fetchMedias({
        limit: 6,
      }),
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const isVideoLoading = isLoadingVideo || isFetchingVideo;
  const reloadVideos = () => { refetchVideos(); };
  const handleNavigation = (card: IContent) => {
    navigation.navigate('media', {
      screen: 'flash-media-preview',
      params: {
        media: card,
      },
    });
  }

  /** Daily content */
  const { data: dailyContentData, isLoading: isLoadingDailyContent, isFetching: isFetchingDailyContent, error: errorDailyContent, refetch: refetchDailyContent } = useQuery({
    queryKey: ['daily-action'],
    queryFn: () => getDailyAction(),
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: 2,
    retryDelay: 2000
  });

  const hasDailyQuestion = dailyContentData && dailyContentData.question;
  const hasDailyPodcast = dailyContentData && dailyContentData.podcast;

  // Daily question
  const [showDailyQuestion, setShowDailyQuestion] = useState(false);
  // Podcast
  const [showPodcast, setShowPodcast] = useState(false);

  // Handle open modal from pushing notification
  useEffect(() => {
    // Daily question
    if (actionChangeScreen == 'daily-question' && hasDailyQuestion) {
      const timeout = setTimeout(() => {
        setShowDailyQuestion(true);
      }, 1000);

      return () => clearTimeout(timeout);
    }

    // Podcast
    if (actionChangeScreen == 'podcast' && hasDailyPodcast) {
      const timeout = setTimeout(() => {
        setShowPodcast(true);
      }, 1000);

      return () => clearTimeout(timeout);
    }

    return;
  }, [actionChangeScreen, hasDailyQuestion, hasDailyPodcast]);


  /** Handle reload screen */
  const reload = () => {
    refetchDailyContent();
    refetchVideos();
  }

  /** Animation */
  // Animation for Quizz icon (shake)
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Animation for Podcast icon (scale)
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Quizz shake animation
    const shakeAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
      ])
    );

    // Podcast scale animation
    const scaleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    shakeAnimation.start();
    scaleAnimation.start();

    return () => {
      shakeAnimation.stop();
      scaleAnimation.stop();
    };
  }, []);

  // Interpolate shake animation to rotation
  const shakeRotation = shakeAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['0deg', '-10deg', '0deg', '10deg', '0deg'],
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}
      edges={Platform.OS === 'android' ? ['top', 'left', 'right'] : ['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" animated={true} backgroundColor={Colors.white} />

      <ScrollView style={{ backgroundColor: Colors.white, flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={(isFetchingDailyContent && !!errorDailyContent)}
            onRefresh={reload}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }>
        <HomeHeader userName={user.name}
          onNotificationPress={() => navigation.navigate('notification-list')}
          hasNotification={user.settings?.notifications.length > 0 || false}
          onSearchPress={() => navigation.navigate('home-search')}
          onToolPress={() => navigation.navigate('tools')}
        />

        {(hasDailyQuestion || hasDailyPodcast) && (
          <>
            <View style={styles.carouselHeader}>
              <Text style={styles.actionlHeaderTitle}>Actions du jour</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bannerScrollContent}
              style={styles.bannerScrollView}
            >
              {/* Quizz Banner */}
              {hasDailyQuestion &&
                <TouchableOpacity
                  style={[styles.dailyQuestionBanner, styles.quizzBanner]}
                  onPress={() => setShowDailyQuestion(true)}
                >
                  <View style={styles.dailyQuestionIconContainer}>
                    <Animated.View style={{ transform: [{ rotate: shakeRotation }] }}>
                      <Ionicons name="bulb" size={28} color={Colors.blue} />
                    </Animated.View>

                    {dailyContentData.has_answered && (
                      <View style={styles.answeredBadge}>
                        <Ionicons name="checkmark-sharp" size={14} color={Colors.blue} />
                      </View>
                    )}
                  </View>
                  <View style={styles.dailyQuestionContent}>
                    <Text style={styles.dailyQuestionTitle}>Quizz</Text>
                    <Text style={styles.dailyQuestionSubtitle} numberOfLines={1} ellipsizeMode='tail'>
                      {dailyContentData.question?.topic?.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              }
              {/* Podcast Banner */}
              {hasDailyPodcast &&
                <TouchableOpacity
                  style={[styles.dailyQuestionBanner, styles.podcastBanner]}
                  onPress={() => {
                    setShowPodcast(true);
                  }}
                >
                  <View style={[styles.dailyQuestionIconContainer, styles.podcastIconContainer]}>
                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                      <Ionicons name="mic" size={28} color={Colors.purple} />
                    </Animated.View>
                  </View>
                  <View style={styles.dailyQuestionContent}>
                    <Text style={styles.dailyQuestionTitle}>Podcast</Text>
                    <Text style={styles.dailyQuestionSubtitle} numberOfLines={1} ellipsizeMode='tail'>
                      {dailyContentData.podcast.title}
                    </Text>
                  </View>
                </TouchableOpacity>
              }
            </ScrollView>
          </>
        )}

        <View style={styles.carouselContainer}>
          <View style={styles.carouselHeader}>
            <Text style={styles.carouselHeaderTitle}>Nos derniers contenus</Text>
            {isVideoLoading ? (
              <View style={[styles.carouselHeaderButton, { marginRight: Spacings.lg }]}>
                <ActivityIndicator size="small" color={Colors.gray} />
              </View>
            ) : isErrorVideo ? (
              <Pressable style={styles.carouselHeaderButton} onPress={reloadVideos}>
                <Text style={styles.carouselHeaderViewMoreButton}>Recharger</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.carouselHeaderButton} onPress={() => navigation.navigate('media')}>
                <Text style={styles.carouselHeaderViewMoreButton}>Voir tous</Text>
              </Pressable>
            )}
          </View>
          {isVideoLoading && (
            <MediaSkeleton numberOfObjects={3} />
          )}
          {!isVideoLoading && !isErrorVideo && (
            <OrthoCarousel entries={videoData} onSelect={handleNavigation} />
          )}
        </View>
      </ScrollView >


      {/* Daily question */}
      {hasDailyQuestion && (
        <DailyQuestionModal
          visible={showDailyQuestion}
          data={dailyContentData}
          onClose={() => {
            if (!dailyContentData.has_answered) {
              refetchDailyContent();
            }
            setShowDailyQuestion(false);
          }}
        />
      )}

      {/* Podcast */}
      {hasDailyPodcast && (
        <PodcastPlayerModal
          visible={showPodcast}
          onClose={() => setShowPodcast(false)}
          audioUrl={dailyContentData.podcast.link}
          thumbnailUrl={dailyContentData.podcast.image}
          title={dailyContentData.podcast.title}
          subtitle={dailyContentData.podcast.author}
          topic={dailyContentData.podcast.topic}
          isSubcribed={dailyContentData.has_topic_podcast}
        />
      )}
    </SafeAreaView >
  );
}


const styles = StyleSheet.create({
  carouselContainer: {
    marginVertical: Spacings.md
  },
  carouselHeader: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    marginBottom: Spacings.md,
    alignItems: 'center'
  },
  carouselHeaderTitle: {
    flex: 2,
    alignSelf: 'flex-start',
    marginLeft: Spacings.lg,
    fontSize: 18,
    color: Colors.primary,
    fontFamily: 'Poppins-Medium',
  },
  carouselHeaderButton: {
    flex: 1,
    alignItems: 'flex-end',
  },
  carouselHeaderViewMoreButton: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    marginRight: Spacings.lg,
  },
  notificationIndicator: {
    backgroundColor: Colors.danger,
    width: 10,
    height: 10,
    borderRadius: 100,
    position: 'absolute',
    alignSelf: 'flex-end'
  },

  // ✨ BANNER STYLES
  actionlHeaderTitle: {
    marginLeft: Spacings.lg,
    fontSize: 18,
    color: Colors.primary,
    fontFamily: 'Poppins-Medium',
  },
  bannerScrollView: {
    marginBottom: Spacings.sm,
    backgroundColor: Colors.white,
  },
  bannerScrollContent: {
    paddingHorizontal: Spacings.lg,
    gap: Spacings.sm,
    backgroundColor: Colors.white,
  },
  dailyQuestionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacings.md,
    borderRadius: 16,
    shadowColor: Colors.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    minWidth: 200,
  },
  quizzBanner: {
    backgroundColor: Colors.blue,
  },
  podcastBanner: {
    backgroundColor: Colors.purple,
    shadowColor: Colors.purple,
  },
  dailyQuestionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacings.md,
  },
  answeredBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.blueBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    shadowColor: Colors.blue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  podcastIconContainer: {
    backgroundColor: Colors.white,
  },
  dailyQuestionContent: {
    flexShrink: 1,
  },
  dailyQuestionTitle: {
    fontSize: 16,
    color: Colors.white,
    fontFamily: 'Poppins-Medium',
    marginBottom: 2,
  },
  dailyQuestionSubtitle: {
    fontSize: 13,
    color: Colors.white,
    fontFamily: 'Poppins-Regular',
  },
})