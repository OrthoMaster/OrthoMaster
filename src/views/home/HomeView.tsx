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
  Linking
} from 'react-native';
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

import { PodcastPlayerModal } from './components/PodcastPlayerModal';


export const HomeView = ({ navigation, route }) => {
  const {
    data: flashData,
    isLoading,
    isFetching,
    isError,
    refetch
  } = useQuery({
    queryKey: ['flash-preview'],
    queryFn: () =>
      fetchMedias({
        limit: 6,
      }),
  });

  const handleNavigation = (card: IContent) => {
    navigation.navigate('media', {
      screen: 'flash-media-preview',
      params: {
        media: card,
      },
    });
  }
  const isFlashLoading = isLoading || isFetching;
  const reload = () => { refetch(); };

  /** Get user */
  const { data: user } = useGetUser();

  /** Daily question */
  const [showDailyQuestion, setShowDailyQuestion] = useState(false);
  const { data: dailyContentData, refetch: refetchDailyContent } = useQuery({
    queryKey: ['daily-action'],
    queryFn: () => getDailyAction()
  });

  const hasDailyQuestion = dailyContentData && dailyContentData.question;
  const hasDailyPodcast = dailyContentData && dailyContentData.podcast;

  /** Podcast */
  const [showPodcast, setShowPodcast] = useState(false);

  /** Animation */
  // Animation for Quizz icon (shake)
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Animation for Podcast icon (scale)
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Quizz shake animation: lắc 2s, nghỉ 2s
    const shakeAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
      ])
    );

    // Podcast scale animation: to ra nhỏ lại 3s, dừng 1s
    const scaleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
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

      <ScrollView style={{ backgroundColor: Colors.white, flex: 1 }}>
        <HomeHeader userName={user.name}
          onNotificationPress={() => navigation.navigate('notification-list')}
          hasNotification={user.settings?.notifications ?? false}
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
            {isFlashLoading ? (
              <View style={[styles.carouselHeaderButton, { marginRight: Spacings.lg }]}>
                <ActivityIndicator size="small" color={Colors.gray} />
              </View>
            ) : isError ? (
              <Pressable style={styles.carouselHeaderButton} onPress={reload}>
                <Text style={styles.carouselHeaderViewMoreButton}>Recharger</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.carouselHeaderButton} onPress={() => navigation.navigate('media')}>
                <Text style={styles.carouselHeaderViewMoreButton}>Voir tous</Text>
              </Pressable>
            )}
          </View>
          {isFlashLoading && (
            <MediaSkeleton numberOfObjects={3} />
          )}
          {!isFlashLoading && !isError && (
            <OrthoCarousel entries={flashData} onSelect={handleNavigation} />
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
  },
  bannerScrollContent: {
    paddingHorizontal: Spacings.lg,
    gap: Spacings.sm,
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