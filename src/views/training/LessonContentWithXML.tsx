/**
 * @author Francis
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Colors from "../../../constants/Colors";
import Spacings from "../../../constants/Spacings";
import XMLParser from 'react-xml-parser';
import { Styles } from "../../../constants/Styles";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getLessonContent, completeLesson } from "../../services/v2/TrainingService";
import { ContentFactory } from "../content/components/ContentFactory";
import LessonSkeleton from './components/LessonSkeleton';

import CelebrationCompleteLessonScreen from './components/CelebrationCompleteLessonScreen';

import { useGlobal } from '../../component/GlobalContext';
import { useGetUser } from '../../hooks/useGetUser.hook';

import VideoAdsModal from "../flash/ads/VideoAdsModal";

const HEADER_HEIGHT = 120;
const SCROLL_THRESHOLD = 5;

// TypeScript interfaces
interface Block {
  id: string;
  type: string;
  data: any;
  tunes?: any;
}

interface User {
  student_flg: boolean;
}

type ScrollDirection = 'up' | 'down' | null;

export const LessonContentWithXML = ({ navigation, route }) => {
  // Hide bottom nav
  useEffect(() => {
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: 'none' }
    });
  }, [navigation]);

  const { data: user } = useGetUser();
  const { lessonId, lessonTitle, trainingName, pkgName, pkgId } = route.params;
  const [showContent, setShowContent] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Get first data
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['lessonContent', lessonId],
    queryFn: () => getLessonContent(lessonId),
    retry: 2,
    retryDelay: 1000,
  });

  useEffect(() => {
    if (data?.xml_content) {
      const parsed = new XMLParser().parseFromString(data.xml_content);
      setShowContent(parsed);
    }
  }, [data]);

  // Handle scrolls
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const [lastScrollY, setLastScrollY] = useState<number>(0);
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(null);

  // Animation values
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const headerScale = useRef(new Animated.Value(1)).current;
  const headerBackgroundOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT / 3, HEADER_HEIGHT],
    outputRange: [0.9, 0.95, 1],
    extrapolate: 'clamp',
  });

  // Handle scroll direction changes
  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }: { value: number }) => {
      const diff = value - lastScrollY;
      // Fix scroll down to reload of scroll view
      if (value <= 0) {
        setScrollDirection('up');
      }

      if (Math.abs(diff) > SCROLL_THRESHOLD) {
        const newDirection: ScrollDirection = diff > 0 ? 'down' : 'up';
        if (newDirection !== scrollDirection) {
          setScrollDirection(newDirection);
          animateHeader(newDirection, value);
        }
        setLastScrollY(value);
      }
    });

    return () => scrollY.removeListener(listenerId);
  }, [lastScrollY, scrollDirection, scrollY]);

  const animateHeader = (direction: ScrollDirection, scrollValue: number): void => {
    const shouldHideHeader = direction === 'down' && scrollValue > 20;
    const toValue = shouldHideHeader ? -HEADER_HEIGHT : 0;
    const opacityValue = shouldHideHeader ? 0.3 : 1;
    const scaleValue = shouldHideHeader ? 0.95 : 1;

    Animated.parallel([
      Animated.spring(headerTranslateY, {
        toValue,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(headerOpacity, {
        toValue: opacityValue,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(headerScale, {
        toValue: scaleValue,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  };

  // Handle close modal
  const closeScreen = (): void => {
    navigation.goBack();
  };

  // Handle complete lesson
  const queryClient = useQueryClient();
  const handleCompleteLesson = useCallback(async () => {
    setShowCelebration(true);

    await completeLesson(lessonId);
    if (pkgId) {
      await queryClient.invalidateQueries({ queryKey: ['packages', pkgId] });
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
    }

    setTimeout(() => {
      if (showCelebration) {
        navigation.goBack();
        setShowCelebration(false);
      }
    }, 7000);
  }, []);

  /**
   * Handle Ads
   */
  const ADS_WAIT_TIME = 60 * 20 // seconds - 20 mins
  const showAdsRef = useRef(false);
  const { globalData, setGlobalData } = useGlobal();
  const [showAds, setShowAds] = useState(false);
  const checkAdsShowable = () => {
    // User is student
    const adsShowable = (user as User)?.student_flg ?? false;
    if (!adsShowable) return false;

    // Get ads show last time
    const adsShowNextTime = globalData.adsShowNextTime;
    const now = Date.now();

    // Show ads if first time or out of saved next time
    if (!adsShowNextTime || now >= adsShowNextTime) {
      return true;
    }
    return false;
  }

  useEffect(() => {
    if (!showAdsRef.current) {
      const openAds = checkAdsShowable();
      if (openAds) {
        showAdsRef.current = true;
        setShowAds(true);
      }
    }
  }, [user]);

  // Handle action close Ads
  const handeAdsClose = () => {
    showAdsRef.current = false;
    setShowAds(false);
    navigation.goBack();
  };

  // Handle after watched Ads
  const handleAdsAfterWatched = () => {
    const now = Date.now();
    // Next time to show ads
    const nextTime = now + (ADS_WAIT_TIME * 1000);

    // Add global param
    setGlobalData(prevData => ({
      ...prevData,
      adsShowNextTime: nextTime
    }));
    showAdsRef.current = false;
    setShowAds(false);
  }

  return (
    <SafeAreaView style={Styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Ads overlay */}
      {showAds &&
        <VideoAdsModal
          enabled={showAds}
          onClose={handeAdsClose}
          grantAccess={handleAdsAfterWatched}
        />}

      {/* Enhanced Animated Header */}
      <Animated.View
        style={[
          styles.header,
          {
            backgroundColor: Colors.white,
            transform: [
              { translateY: headerTranslateY },
              { scale: headerScale }
            ],
            opacity: Animated.multiply(headerOpacity, headerBackgroundOpacity),
          },
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={closeScreen}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View>
            <Text numberOfLines={1} ellipsizeMode='tail' style={styles.headerSubTitle}>
              {trainingName}
            </Text>
            {pkgName &&
              <Text numberOfLines={1} ellipsizeMode='tail' style={styles.headerSubTitle2}>
                {pkgName}
              </Text>
            }
            <Text numberOfLines={1} ellipsizeMode='tail' style={styles.headerTitle}>
              {lessonTitle}
            </Text>
          </View>
        </View>

        {/* Header bottom border with animation */}
        <Animated.View
          style={[
            styles.headerBorder,
            {
              opacity: scrollY.interpolate({
                inputRange: [0, 80, 120],
                outputRange: [0, 0.5, 1],
                extrapolate: 'clamp',
              }),
            },
          ]}
        />
      </Animated.View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={true}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            colors={[Colors.blue]}
            tintColor={Colors.blue}
            style={{ zIndex: 9999 }}
          />
        }
      >
        {/* Show error  */}
        {error && !isLoading &&
          <View style={[Styles.container, styles.errorContainer]}>
            <Text style={styles.errorText}>Impossible de charger le contenu. Réessayez ou contactez-nous si le problème persiste.</Text>
          </View>
        }

        {/* Show loading for initial load */}
        {isLoading &&
          <LessonSkeleton numberOfObjects={2} />
        }

        {/* Render data */}
        {showContent && (
          <ContentFactory
            component={showContent}
            contentInfos={data}
            onQuizCompleted={handleCompleteLesson}
          />
        )}
      </ScrollView>

      <CelebrationCompleteLessonScreen
        visible={showCelebration}
        onClose={() => {
          navigation.goBack();
          setShowCelebration(false);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    shadowColor: Colors.gray,
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    height: HEADER_HEIGHT
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.xxxl,
    paddingBottom: Spacings.md,
  },
  headerSubTitle: {
    fontSize: 10,
    fontFamily: 'Roboto',
    fontWeight: '400',
    textAlign: 'right',
    color: Colors.subtext,
  },
  headerSubTitle2: {
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    textAlign: 'right',
    color: Colors.text,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Roboto',
    fontWeight: '600',
    textAlign: 'right',
    color: Colors.text,
  },
  headerBorder: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    paddingTop: HEADER_HEIGHT - Spacings.xxl,
    paddingBottom: Spacings.xxl,
    // paddingHorizontal: Spacings.lg,
  },

  // Block styles
  blockContainer: {

  },
  blockText: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: 'Roboto',
    height: 200
  },

  // Loading and error styles
  loadingFooter: {
    paddingVertical: Spacings.lg,
    alignItems: 'center',
  },
  errorContainer: {
    marginTop: Spacings.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Roboto',
    color: Colors.danger,
    textAlign: 'center',
    backgroundColor: Colors.dangerBackground,
    marginHorizontal: Spacings.lg,
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.md,
    borderLeftWidth: 2,
    borderLeftColor: Colors.danger,
  },

});