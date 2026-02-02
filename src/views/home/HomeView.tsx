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
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useQuery } from "@tanstack/react-query"
import { fetchMedias } from '../../services/FlashMediasService';
import { OrthoCarousel } from '../../component/OrthoCarousel'
import { HomeHeader } from './HomeHeader';

import { IContent } from '../../utils/interfaces';

import MediaSkeleton from '../../views/media/components/MediaSkeleton';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import { useGetUser } from '../../hooks/auth.hook';

import { DailyQuestionModal } from './components/DailyQuestionModal';
import { getDailyAction } from '../../services/v2/ContentService';
import { getPreFormData, updateSettings, sendError } from '../../services/v2/AuthService';

import { PodcastPlayerModal } from './components/PodcastPlayerModal';
import { TopicsOnboardingModal } from './components/TopicsOnboardingModal';

interface Topic {
  id: string;
  name: string;
  image?: string;
  description?: string;
}

export const HomeView = ({ navigation, route }) => {
  const actionChangeScreen = route.params?.action ?? null;

  const storageGet = async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return await AsyncStorage.getItem(key);
  };

  const storageSet = async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await AsyncStorage.setItem(key, value);
  };

  /** Get user */
  const { data: user, refetch: refetchUser } = useGetUser();

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

  const hasDailyQuestions = dailyContentData?.questions && dailyContentData.questions.length > 0;
  const hasDailyPodcasts = dailyContentData?.podcasts && dailyContentData.podcasts.length > 0;

  // Daily question
  const [showDailyQuestion, setShowDailyQuestion] = useState(false);
  const [selectedQuestionData, setSelectedQuestionData] = useState(null);

  // Podcast
  const [showPodcast, setShowPodcast] = useState(false);
  const [selectedPodcastData, setSelectedPodcastData] = useState(null);

  // Handle open modal from pushing notification
  useEffect(() => {
    // Daily question - Open
    if (actionChangeScreen == 'daily-question' && hasDailyQuestions) {
      const timeout = setTimeout(() => {
        setSelectedQuestionData(dailyContentData.questions[0]);
        setShowDailyQuestion(true);
      }, 1000);

      return () => clearTimeout(timeout);
    }

    // Podcast - Open
    if (actionChangeScreen == 'podcast' && hasDailyPodcasts) {
      const timeout = setTimeout(() => {
        setSelectedPodcastData(dailyContentData.podcasts[0]);
        setShowPodcast(true);
      }, 1000);

      return () => clearTimeout(timeout);
    }

    return;
  }, [actionChangeScreen, hasDailyQuestions, hasDailyPodcasts]);

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

  // Handle open question modal
  const handleOpenQuestion = (questionData) => {
    setSelectedQuestionData(questionData);
    setShowDailyQuestion(true);
  };

  // Handle open podcast modal
  const handleOpenPodcast = (podcastData) => {
    setSelectedPodcastData(podcastData);
    setShowPodcast(true);
  };

  /** Topics onboarding */
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);

  // Load topics data
  const { data: preData, isLoading: isLoadingTopics } = useQuery({
    queryKey: ['pre-form-data-profile'],
    queryFn: () => getPreFormData(),
  });

  // Set topics from API
  useEffect(() => {
    if (preData?.data?.topics && user.settings?.topics?.length == 0) {
      setTopics(preData.data.topics);
    }
  }, [preData]);

  // Check AsyncStorage
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user || isLoadingTopics || topics.length === 0) return;

      try {
        const hasOpened = await storageGet('open-topics-onboarding');

        if (!hasOpened || hasOpened === 'false') {
          setTimeout(() => {
            setShowOnboarding(true);
          }, 1000);
        }
      } catch (error) {
        sendError('topics-onboarding-modal', error);
      }
    };

    checkOnboardingStatus();
  }, [user, topics, isLoadingTopics]);

  // Handle onboarding complete
  const handleOnboardingComplete = async (selectedTopicIds: string[]) => {
    try {
      const result = await updateSettings({
        notifications: true,
        favoriteTopicIds: selectedTopicIds,
      });

      if (result === true) {
        await storageSet('open-topics-onboarding', 'true');
        setShowOnboarding(false);
        refetchUser();
      }

      return;
    } catch (error) {
      sendError('topics-onboarding-modal', error);
    }
  };

  // Handle skip onboarding
  const handleSkipOnboarding = async () => {
    try {
      await storageSet('open-topics-onboarding', 'true');
      setShowOnboarding(false);
    } catch (error) {
      setShowOnboarding(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}
      edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

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

        {(hasDailyQuestions || hasDailyPodcasts) && (
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
              {/* Quizz Banners - questions */}
              {hasDailyQuestions && dailyContentData.questions.map((questionData, index) => (
                <TouchableOpacity
                  key={`question-${index}`}
                  style={[styles.dailyQuestionBanner, styles.quizzBanner]}
                  onPress={() => handleOpenQuestion(questionData)}
                >
                  <View style={styles.dailyQuestionIconContainer}>
                    <Animated.View style={{ transform: [{ rotate: shakeRotation }] }}>
                      <Ionicons name="bulb" size={28} color={Colors.blue} />
                    </Animated.View>

                    {questionData.has_answered && (
                      <View style={styles.answeredBadge}>
                        <Ionicons name="checkmark-sharp" size={14} color={Colors.blue} />
                      </View>
                    )}
                  </View>
                  <View style={styles.dailyQuestionContent}>
                    <Text style={styles.dailyQuestionTitle}>Quizz</Text>
                    <Text style={styles.dailyQuestionSubtitle} numberOfLines={1} ellipsizeMode='tail'>
                      {questionData.question?.topic?.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Podcast Banners - podcasts */}
              {hasDailyPodcasts && dailyContentData.podcasts.map((podcastData, index) => (
                <TouchableOpacity
                  key={`podcast-${index}`}
                  style={[styles.dailyQuestionBanner, styles.podcastBanner]}
                  onPress={() => handleOpenPodcast(podcastData)}
                >
                  <View style={[styles.dailyQuestionIconContainer, styles.podcastIconContainer]}>
                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                      <Ionicons name="mic" size={28} color={Colors.purple} />
                    </Animated.View>
                  </View>
                  <View style={styles.dailyQuestionContent}>
                    <Text style={styles.dailyQuestionTitle}>Podcast</Text>
                    <Text style={styles.dailyPodcastSubtitle} numberOfLines={1} ellipsizeMode='tail'>
                      {podcastData.podcast.title}
                    </Text>
                    <Text style={styles.dailyPodcastDuration}>{podcastData.podcast.duration}</Text>
                  </View>
                </TouchableOpacity>
              ))}
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
            ) : isErrorVideo && (
              <Pressable style={styles.carouselHeaderButton} onPress={reloadVideos}>
                <Text style={styles.carouselHeaderViewMoreButton}>Recharger</Text>
              </Pressable>
            )}
          </View>
          {isVideoLoading && (
            <MediaSkeleton numberOfObjects={Platform.OS === 'web' ? 5 : 3} horizontal={Platform.OS === 'web'}/>
          )}
          {!isVideoLoading && !isErrorVideo && (
            <OrthoCarousel entries={videoData} onSelect={handleNavigation} />
          )}
        </View>
      </ScrollView >


      {/* Daily question modal */}
      {selectedQuestionData && (
        <DailyQuestionModal
          visible={showDailyQuestion}
          data={{
            question: selectedQuestionData.question,
            user_answer_id: selectedQuestionData.user_answer_id,
            has_answered: selectedQuestionData.has_answered,
            has_topic_question: selectedQuestionData.has_topic,
          }}
          onClose={() => {
            if (!selectedQuestionData.has_answered) {
              refetchDailyContent();
            }
            setShowDailyQuestion(false);
            setSelectedQuestionData(null);
          }}
        />
      )}

      {/* Podcast modal */}
      {selectedPodcastData && (
        <PodcastPlayerModal
          visible={showPodcast}
          onClose={() => {
            setShowPodcast(false);
            setSelectedPodcastData(null);
          }}
          audioUrl={selectedPodcastData.podcast.link}
          thumbnailUrl={selectedPodcastData.podcast.image}
          title={selectedPodcastData.podcast.title}
          subtitle={selectedPodcastData.podcast.author}
          topic={selectedPodcastData.podcast.topic}
          isSubcribed={selectedPodcastData.has_topic}
        />
      )}

      {/* Topics Onboarding Modal */}
      {user.settings?.topics?.length == 0 && topics.length > 0 &&
        <TopicsOnboardingModal
          visible={showOnboarding}
          topics={topics}
          onComplete={handleOnboardingComplete}
          onSkip={handleSkipOnboarding}
        />
      }
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

  // BANNER STYLES
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
    fontSize: 14,
    color: Colors.white,
    fontFamily: 'Poppins-Medium',
    marginBottom: 1,
  },
  dailyQuestionSubtitle: {
    fontSize: 13,
    color: Colors.white,
    fontFamily: 'Poppins-Regular',
  },
  dailyPodcastSubtitle: {
    fontSize: 11,
    color: Colors.white,
    fontFamily: 'Poppins-Regular',
  },
  dailyPodcastDuration: {
    fontSize: 10,
    color: Colors.grayLight,
    fontFamily: 'Poppins-Regular',
  }
})