import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  Pressable,
  StatusBar,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

import { useQuery } from "@tanstack/react-query"
import { OrthoCarousel } from '../../component/OrthoCarousel'
import { HomeHeader } from './HomeHeader';

import { IContent } from '../../utils/interfaces';

import MediaSkeleton from '../../views/media/components/MediaSkeleton';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import { useGetUser } from '../../hooks/auth.hook';

import { getDailyAction, getNewests } from '../../services/v2/ContentService';
import { getPreFormData, updateSettings, sendError } from '../../services/v2/AuthService';

import { TopicsOnboardingModal } from './components/TopicsOnboardingModal';

import RemindCreateCompanyModal from './components/RemindCreateCompanyModal';
import RemindAddPackageCompanyModal from './components/RemindAddPackageCompanyModal';

interface Topic {
  id: string;
  name: string;
  image?: string;
  description?: string;
}

/** Actions du jour - card theme & component */
const PRESS_DEPTH = 7;
const CARD_HEIGHT = 104;
const ICON_SIZE = 104;
const PIVOT = ICON_SIZE / 2;
const BASE_TILT = -10;

const ACTION_THEMES = {
  quiz: { base: Colors.blue, edge: '#2F6CB5', motion: 'swingBottom' },
  podcast: { base: Colors.purple, edge: '#6F528F', motion: 'pulse' },
  infographic: { base: Colors.primaryLight, edge: '#D97A00', motion: 'swingRight' },
};

const ActionCard = ({ theme, renderIcon, title, meta, metaIcon, showCheck, onPress, index = 0 }) => {
  const pressAnim = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;
  const iconAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shine = Animated.loop(
      Animated.sequence([
        Animated.delay(1500 + index * 500),
        Animated.timing(shineAnim, { toValue: 1, duration: 850, useNativeDriver: true }),
        Animated.timing(shineAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(3500),
      ])
    );
    shine.start();
    return () => shine.stop();
  }, []);

  useEffect(() => {
    const motion = Animated.loop(
      Animated.sequence([
        Animated.delay(800 + index * 400),
        Animated.timing(iconAnim, {
          toValue: 1,
          duration: theme.motion === 'pulse' ? 2200 : 2600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(iconAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(5000),
      ])
    );
    motion.start();
    return () => motion.stop();
  }, []);

  const pressIn = () =>
    Animated.spring(pressAnim, { toValue: 1, speed: 50, bounciness: 0, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(pressAnim, { toValue: 0, speed: 20, bounciness: 10, useNativeDriver: true }).start();

  const pushY = pressAnim.interpolate({ inputRange: [0, 1], outputRange: [0, PRESS_DEPTH] });
  const shineX = shineAnim.interpolate({ inputRange: [0, 1], outputRange: [-90, 280] });
  const swing = iconAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [
      `${BASE_TILT}deg`,
      `${BASE_TILT - 30}deg`,
      `${BASE_TILT}deg`,
      `${BASE_TILT + 30}deg`,
      `${BASE_TILT}deg`,
    ],
  });
  const pulse = iconAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [1, 1.18, 1, 1.18, 1],
  });

  const iconTransform =
    theme.motion === 'pulse'
      ? [{ rotate: `${BASE_TILT}deg` }, { scale: pulse }]
      : theme.motion === 'swingBottom'
        ? [{ translateY: PIVOT }, { rotate: swing }, { translateY: -PIVOT }]
        : [{ translateX: PIVOT }, { rotate: swing }, { translateX: -PIVOT }];

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <View style={[styles.cardOuter, { backgroundColor: theme.edge, shadowColor: theme.edge }]}>
        <Animated.View
          style={[styles.cardInner, { backgroundColor: theme.base, transform: [{ translateY: pushY }] }]}
        >
          {/* Icon watermark - bottom right */}
          <Animated.View style={[styles.iconMark, { transform: iconTransform }]} pointerEvents="none">
            {renderIcon('rgba(255,255,255,0.18)', ICON_SIZE)}
          </Animated.View>

          <Animated.View
            pointerEvents="none"
            style={[styles.shine, { transform: [{ translateX: shineX }, { rotate: '18deg' }] }]}
          />

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={2} ellipsizeMode="tail">
              {title}
            </Text>
            {!!meta && (
              <View style={styles.metaPill}>
                {!!metaIcon && <Ionicons name={metaIcon} size={11} color={Colors.white} />}
                <Text style={styles.metaText} numberOfLines={1} ellipsizeMode="tail">
                  {meta}
                </Text>
              </View>
            )}
          </View>

          {showCheck && (
            <View style={[styles.checkBadge, { backgroundColor: Colors.success }]}>
              <Ionicons name="checkmark-sharp" size={12} color={Colors.white} />
            </View>
          )}
        </Animated.View>
      </View>
    </Pressable>
  );
};

export const HomeView = ({ navigation, route }) => {
  const actionChangeScreen = route.params?.action ?? null;

  // Global CSS Scroll bar - Web version
  useEffect(() => {
    if (Platform.OS === 'web') {
      const styleId = 'global-scrollbar-styles';

      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          /* Scrollbar thin và neutral cho cả light/dark mode */
          ::-webkit-scrollbar {
            width: 8px;  /* Scrollbar dọc */
            height: 8px; /* Scrollbar ngang */
          }
          
          ::-webkit-scrollbar-track {
            background: rgba(128, 128, 128, 0.1); /* Gray nhạt, trong suốt */
            border-radius: 10px;
          }
          
          ::-webkit-scrollbar-thumb {
            background: rgba(128, 128, 128, 0.4); /* Gray trung bình */
            border-radius: 10px;
            border: 2px solid transparent;
            background-clip: padding-box;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(128, 128, 128, 0.6); /* Đậm hơn khi hover */
            background-clip: padding-box;
          }
          
          /* Firefox */
          * {
            scrollbar-width: thin;
            scrollbar-color: rgba(128, 128, 128, 0.4) rgba(128, 128, 128, 0.1);
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  // Show bottom nav when screen is focused
  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'flex' }
      });
    }, [navigation])
  );

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
    queryKey: ['newest-media'],
    queryFn: getNewests,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: 2,
    retryDelay: 2000
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
  const hasInfographics = dailyContentData?.infographics && dailyContentData.infographics.length > 0;

  /** Handle reload screen */
  const reload = () => {
    refetchDailyContent();
    refetchVideos();
  }

  // Handle open podcast
  const handleOpenPodcast = (podcastData) => {
    navigation.navigate('podcast', {
      podcastId: String(podcastData.podcast.id),
    });
  };

  const handleOpenInfographic = (infographicData) => {
    navigation.navigate('infographic', {
      infographicId: String(infographicData.infographic.id),
    });
  };

  // Handle open question
  const handleOpenQuestion = (questionData) => {
    navigation.navigate('daily-question', {
      questionId: String(questionData.question.id),
    });
  };

  /** Company - Manager modals */
  const [showRemind, setShowRemind] = useState(false);
  const [onboardingResolved, setOnboardingResolved] = useState(false);
  const checkShouldShowRemind = async () => {
    if (!user?.remind_manager_to_add_package
      && !user?.remind_to_create_company
      && !user?.remind_manager_to_add_member
      && !user?.remind_to_open_new_package) {
      return;
    }
    try {
      const value = await AsyncStorage.getItem('@last_time_open_remind_modal');
      const now = Date.now();
      const TWO_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

      if (value === null) {
        await AsyncStorage.setItem('@last_time_open_remind_modal', now.toString());
        setShowRemind(true);
        return;
      }

      const lastTime = parseInt(value, 10);

      if (isNaN(lastTime)) {
        await AsyncStorage.setItem('@last_time_open_remind_modal', now.toString());
        setShowRemind(true);
        return;
      }

      // More than 2 days
      if (now - lastTime >= TWO_DAYS_MS) {
        await AsyncStorage.setItem('@last_time_open_remind_modal', now.toString());
        setShowRemind(true);
        return;
      }
    } catch (error) {
      return;
    }
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
      if (!user || isLoadingTopics || topics.length === 0) {
        setOnboardingResolved(true);
        return;
      };

      try {
        const hasOpened = await storageGet('open-topics-onboarding');

        if (!hasOpened || hasOpened === 'false') {
          setTimeout(() => {
            setShowOnboarding(true);
          }, 1000);
        } else {
          setOnboardingResolved(true);
        }
      } catch (error) {
        sendError('topics-onboarding-modal', error);
        setOnboardingResolved(true);
      }
    };

    checkOnboardingStatus();
  }, [user, topics, isLoadingTopics]);

  // Triger with show remind popup
  useFocusEffect(
    useCallback(() => {
      if (onboardingResolved && !showOnboarding) {
        checkShouldShowRemind();
      }
    }, [onboardingResolved, showOnboarding])
  );

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
    } catch (error) {
      sendError('topics-onboarding-modal', error);
      setShowOnboarding(false);
      refetchUser();
    }

    setOnboardingResolved(true);
  };

  // Handle skip onboarding
  const handleSkipOnboarding = async () => {
    try {
      await storageSet('open-topics-onboarding', 'true');
      setShowOnboarding(false);
    } catch (error) {
      setShowOnboarding(false);
    }

    setOnboardingResolved(true);
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
        <HomeHeader userName={user.name + ' ' + (user.first_name ?? '')}
          onNotificationPress={() => navigation.navigate('notification-list')}
          hasNotification={user.settings?.notifications.length > 0 || false}
          onSearchPress={() => navigation.navigate('home-search')}
          onToolPress={() => navigation.navigate('tools')}
        />

        {(hasDailyQuestions || hasDailyPodcasts || hasInfographics) && (
          <View style={styles.actionSection}>
            <View style={styles.actionHeader}>
              <Text style={styles.actionHeaderTitle}>Actions du jour</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bannerScrollContent}
              style={styles.bannerScrollView}
            >
              {/* Quiz */}
              {hasDailyQuestions && dailyContentData.questions.map((questionData, index) => (
                <ActionCard
                  key={`question-${index}`}
                  index={index}
                  theme={ACTION_THEMES.quiz}
                  renderIcon={(color, size) => <MaterialIcons name="quiz" size={size} color={color} />}
                  title={questionData.question?.title}
                  meta={questionData.question?.topic?.label}
                  showCheck={questionData.has_answered}
                  onPress={() => handleOpenQuestion(questionData)}
                />
              ))}

              {/* Podcast */}
              {hasDailyPodcasts && dailyContentData.podcasts.map((podcastData, index) => (
                <ActionCard
                  key={`podcast-${index}`}
                  index={index + 1}
                  theme={ACTION_THEMES.podcast}
                  renderIcon={(color, size) => <Ionicons name="mic" size={size} color={color} />}
                  title={podcastData.podcast.title}
                  meta={podcastData.podcast.duration}
                  metaIcon="time-outline"
                  onPress={() => handleOpenPodcast(podcastData)}
                />
              ))}

              {/* Infographie */}
              {hasInfographics && dailyContentData.infographics.map((infographicData, index) => (
                <ActionCard
                  key={`infographic-${index}`}
                  index={index + 2}
                  theme={ACTION_THEMES.infographic}
                  renderIcon={(color, size) => <Ionicons name="image" size={size} color={color} />}
                  title={infographicData.infographic.title}
                  meta={infographicData.infographic?.topic?.label}
                  onPress={() => handleOpenInfographic(infographicData)}
                />
              ))}
            </ScrollView>
          </View>
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
            <MediaSkeleton numberOfObjects={Platform.OS === 'web' ? 5 : 3} horizontal={Platform.OS === 'web'} />
          )}
          {!isVideoLoading && !isErrorVideo && (
            <OrthoCarousel entries={videoData} onSelect={handleNavigation} />
          )}
        </View>
      </ScrollView >

      {/* Topics Onboarding Modal */}
      {user.settings?.topics?.length == 0 && topics.length > 0 &&
        <TopicsOnboardingModal
          visible={showOnboarding}
          topics={topics}
          onComplete={handleOnboardingComplete}
          onSkip={handleSkipOnboarding}
        />
      }


      <RemindCreateCompanyModal
        visible={showRemind && user?.remind_to_create_company}
        firstName={user.first_name ?? ''}
        onCreateTeam={() => navigation.navigate('company')}
        onClose={() => setShowRemind(false)}
      />

      <RemindAddPackageCompanyModal
        visible={showRemind && user?.remind_manager_to_add_package}
        firstName={user.first_name ?? ''}
        onUnlockTrainings={() => navigation.navigate('company')}
        onClose={() => setShowRemind(false)}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  carouselContainer: {
    marginVertical: Spacings.lg
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

  // ACTIONS DU JOUR
  actionHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacings.md,
  },
  actionHeaderTitle: {
    flex: 2,
    alignSelf: 'flex-start',
    marginLeft: Spacings.lg,
    fontSize: 18,
    color: Colors.primary,
    fontFamily: 'Poppins-Medium',
  },
  actionSection: {
    marginTop: Spacings.xs,
  },
  bannerScrollView: {
    backgroundColor: Colors.white,
  },
  bannerScrollContent: {
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.xxs,
    paddingBottom: Spacings.md,
    gap: Spacings.sm,
    backgroundColor: Colors.white,
  },

  // ACTION CARD
  cardOuter: {
    width: 236,
    borderRadius: 22,
    paddingBottom: PRESS_DEPTH,
  },
  cardInner: {
    justifyContent: 'center',
    height: CARD_HEIGHT,
    paddingVertical: Spacings.sm,
    paddingLeft: Spacings.md,
    paddingRight: Spacings.xl,
    borderRadius: 22,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  iconMark: {
    position: 'absolute',
    right: -18,
    bottom: -20,
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center'
  },
  shine: {
    position: 'absolute',
    top: -80,
    bottom: -80,
    left: 0,
    width: 34,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  cardTitle: {
    fontSize: 15,
    lineHeight: 20,
    color: Colors.white,
    fontFamily: 'Poppins-Medium',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    marginTop: Spacings.xs,
    paddingHorizontal: Spacings.xs,
    paddingVertical: 2,
    borderRadius: 999,
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  metaText: {
    fontSize: 11,
    color: Colors.white,
    fontFamily: 'Poppins-Regular',
    letterSpacing: 0.3,
  },
  checkBadge: {
    position: 'absolute',
    top: Spacings.xs,
    right: Spacings.xs,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.white,
  },
})