import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  StatusBar,
  Platform,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useQuery } from "@tanstack/react-query"
import { HomeHeader } from './HomeHeader';

import { IContent } from '../../utils/interfaces';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import { useGetUser } from '../../hooks/auth.hook';

import { getDailyAction, getNewests } from '../../services/v2/ContentService';
import { getPreFormData, updateSettings, sendError, getNotifications } from '../../services/v2/AuthService';

import { TopicsOnboardingModal } from './components/TopicsOnboardingModal';

import RemindCreateCompanyModal from './components/RemindCreateCompanyModal';
import RemindAddPackageCompanyModal from './components/RemindAddPackageCompanyModal';

import { DailyActionCards } from './components/DailyActionCards';
import { DailyActionPicker } from './components/DailyActionPicker';
import { LatestContents } from './components/LatestContents';
import {
  DailyActionGroup,
  DailyActionItem,
  buildDailyGroups,
  loadSeen,
  saveSeen,
  seenKey,
} from './components/dailyActions';

interface Topic {
  id: string;
  name: string;
  image?: string;
  description?: string;
}

const isWeb = Platform.OS === 'web';

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

  /** Profil : pastille si une notification n'est pas lue (même clé que l'écran Notifications) */
  const { data: notificationData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(),
    refetchOnWindowFocus: true,
  });
  const notificationList = Array.isArray(notificationData) ? notificationData : (notificationData?.data?.data || []);
  const hasUnreadNotification = Array.isArray(notificationList) && notificationList.some((n: any) => !n.read_flg);

  /** Actions du jour : regroupées par type, la plus récente en tête */
  const [seen, setSeen] = useState<string[]>([]);
  const [pickerGroup, setPickerGroup] = useState<DailyActionGroup | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadSeen().then(setSeen);
    }, [])
  );

  const dailyGroups = useMemo(() => buildDailyGroups(dailyContentData, seen), [dailyContentData, seen]);

  const openDailyItem = (item: DailyActionItem) => {
    setPickerGroup(null);

    if (item.type !== 'quiz') {
      const key = seenKey(item.type, item.id);
      if (!seen.includes(key)) {
        const next = [...seen, key];
        setSeen(next);
        saveSeen(next);
      }
    }

    if (item.type === 'quiz') handleOpenQuestion(item.raw);
    else if (item.type === 'podcast') handleOpenPodcast(item.raw);
    else handleOpenInfographic(item.raw);
  };

  // Un seul élément : on l'ouvre directement, sans passer par la liste.
  const openDailyGroup = (group: DailyActionGroup) => {
    if (group.items.length === 1) openDailyItem(group.items[0]);
    else setPickerGroup(group);
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
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.primaryLightBackground} />

      <ScrollView style={styles.screen}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={(isFetchingDailyContent && !!errorDailyContent)}
            onRefresh={reload}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }>
        <HomeHeader userName={[user.name, user.first_name].filter(Boolean).join(' ')}
          hasUnreadNotification={hasUnreadNotification}
          onProfilePress={() => navigation.navigate('profile')}
          onSearchPress={() => navigation.navigate('home-search')}
          onToolPress={() => navigation.navigate('tools')}
        />

        <View style={styles.content}>
          {dailyGroups.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Actions du jour</Text>
              <DailyActionCards groups={dailyGroups} onOpenGroup={openDailyGroup} />
            </View>
          )}

          <View style={styles.section}>
            <LatestContents
              entries={videoData}
              isLoading={isVideoLoading}
              isError={isErrorVideo}
              onReload={reloadVideos}
              onSelect={handleNavigation}
              onSeeAll={() => navigation.navigate('media')}
            />
          </View>
        </View>
      </ScrollView >

      <DailyActionPicker group={pickerGroup} onClose={() => setPickerGroup(null)} onSelect={openDailyItem} />

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
  /* ---- Écran ---- */
  screen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  // Sur tablette et sur le web, le contenu ne s'étire pas sur toute la largeur.
  content: {
    width: '100%',
    maxWidth: isWeb ? 1120 : 640,
    alignSelf: 'center',
    paddingHorizontal: isWeb ? 40 : Spacings.md,
    paddingBottom: Spacings.xl,
  },

  /* ---- Sections ---- */
  section: {
    marginTop: isWeb ? 28 : Spacings.lg,
  },
  sectionTitle: {
    marginBottom: Spacings.sm,
    fontSize: isWeb ? 18 : 17,
    lineHeight: isWeb ? 26 : 24,
    color: Colors.text,
    fontFamily: 'Poppins-Medium',
    textAlign: isWeb ? 'center' : 'left',
  },
})
