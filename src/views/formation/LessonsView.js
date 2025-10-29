import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  FlatList,
  View,
  Image,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from "@tanstack/react-query";
import { fetchLessonByModuleWithProgression } from '../../services/ContentService';

import { getS3Image } from '../../services/S3Service';
import { LessonButton } from './components/LessonButton';

import { useGlobal } from '../../component/GlobalContext';
import { useGetUser } from '../../hooks/useGetUser.hook';
import { AdServingModalMediaAccess } from "../flash/ads/AdServingModalMediaAccess";

import { checkExistContent } from "../../services/v2/LessonService";

export function LessonsView({ route, navigation }) {
  let { module, demoMode, formation } = route.params
  const lessons = useQuery({
    queryKey: ['Formation', 'GET', 'lessonProgress', module.module.module_num],
    queryFn: () => fetchLessonByModuleWithProgression(module.module.module_num)
  })
  const [refreshing, setRefreshing] = useState(false)
  const [moduleLogo, setModuleLogo] = useState(null)

  const getModuleLogo = async () => {
    let path = module.module.logo_path + '/logo.png'

    try {
      const imageUrl = await getS3Image(path)
      return (imageUrl)
    } catch (error) {
      throw error
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    lessons.refetch()
    getModuleLogo().then((value) => {
      setModuleLogo(value)
    })
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  useEffect(() => {
    var isDisplayed = true

    getModuleLogo().then((value) => {
      if (isDisplayed) {
        setModuleLogo(value)
      }
    })
    return (() => {
      isDisplayed = false
    })
  }, [])

  /**
    * Handle Ads
    * Show ads with students
    * @author Francis
    */
  const { data: user } = useGetUser();
  const ADS_WAIT_TIME = 60 * 20 // seconds - 20 mins
  const showAdsRef = useRef(false);
  const { globalData, setGlobalData } = useGlobal();
  const [showAds, setShowAds] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState();

  /**
   * Check ads showable
   * Student and out of time
   * @author Francis
   * @returns 
   */
  const checkAdsShowable = () => {
    // For testing
    return false;

    // User is student
    const adsShowable = user.is_student ? true : false;

    // If not in case showable
    if (!adsShowable) return false;

    // Get ads show last time
    const adsShowNextTime = globalData.adsShowNextTime;
    const now = Date.now();

    // Show ads if first time or out of saved next time
    if (!adsShowNextTime || now >= adsShowNextTime) {
      setShowAds(true);
      return true;
    }

    return false;
  }

  /**
   * Handle action close Ads
   * @author Francis
   */
  const handeAdsClose = () => {
    setSelectedLesson(null);
    showAdsRef.current = false;
    setShowAds(false);
  };

  /**
   * Handle after watched Ads
   * @returns 
   */
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

    // Move to selected lesson
    return handleDisplayLessonContent(selectedLesson);
  }

  /**
   * Render Ads overlay
   * @returns 
   */
  const AdsOverlay = () => {
    if (!showAds) return null;

    return (
      <AdServingModalMediaAccess
        enabled={showAds}
        closable={true}
        onClose={handeAdsClose}
        grantAccess={handleAdsAfterWatched}
      />
    )
  }

  /**
   * Handle open content with or without ads popup
   * @author Francis
   */
  const handleOpenContent = (lesson) => {
    // If publish
    if (lesson.content.published == true) {

      // Save selected lesson to move content
      setSelectedLesson(lesson);

      // Check showable ads popup
      if (checkAdsShowable() == true) return;

      // If not, move to content
      return handleDisplayLessonContent(lesson);

    }
  }

  /**
   * Handle display lesson
   */
  const handleDisplayLessonContent = async (lesson) => {
    const newContentLesson = await checkExistContent({
      contentId: lesson.content.id_content
    });

    if (newContentLesson !== null) {
      navigation.navigate('lesson-content', {
        newLessonId: newContentLesson.id,
        lessonTitle: lesson.content.title,
        formationName: formation.formation_name
      })
    } else {
      navigation.push('formation-content', {
        content: lesson.content,
        formation: formation,
        type: "lesson",
        demoMode: demoMode
      })
    }
  }

  return <View style={styles.container}>
    <SafeAreaView style={[styles.headerContainer, { backgroundColor: module.module.theme_color }]} />

    <View style={styles.headerBox}>
      {
        moduleLogo &&
        <Image
          source={{ uri: moduleLogo }}
          style={{
            marginVertical: 5,
            width: 100,
            height: 100,
            resizeMode: 'contain'
          }}
        />
      }
      <Text style={styles.headerModule}>Module</Text>
      <Text style={styles.headerTitle}>{module.module.title}</Text>

      <View style={styles.progressContanier}>
        <Text style={styles.progressIcons}>📚</Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { backgroundColor: module.module.theme_color, width: (module.lesson_succeed * 100 / module.total_lesson).toString() + "%" }]} />
        </View>
        <Text style={styles.progressIcons}>👨‍🎓</Text>
      </View>

      <FlatList
        data={lessons.data}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<View style={{ height: 100 }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={(item) => <LessonButton
          lesson={item.item}
          isBlocked={demoMode && item.item.demo_access == false}
          onPress={(lesson) => {
            handleOpenContent(lesson);
          }}
        />
        }
        keyExtractor={(item, index) => index}
        style={styles.lessonList}
      />
    </View>

    {/* Ads overlay */}
    <AdsOverlay />
  </View>
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
    alignItems: 'center'
  },
  headerContainer: {
    height: '20%',
    width: '100%',
  },

  headerBackButton: {
    width: 100,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerBox: {
    alignItems: 'center',
    top: -50,
    width: '90%',
    height: '100%',
  },
  headerModule: {
    fontWeight: '400',
    fontSize: 16,
    color: '#838393',
    marginVertical: 5
  },
  headerTitle: {
    fontWeight: '600',
    fontSize: 22
  },
  headerDescription: {
    fontWeight: '400'
  },

  progressContanier: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center'
  },
  progressIcons: {
    fontSize: 30
  },
  progressBarContainer: {
    backgroundColor: '#BCBCBC',
    flex: 1,
    height: '30%',
    borderRadius: 20
  },
  progressBar: {
    flex: 1,
    borderRadius: 20
  },
  lessonList: {
    width: '100%',
    flex: 1,
  },

  invertedRadiusHeader: {
    backgroundColor: '#fffefd',
    width: 800,
    height: 800,
    borderRadius: 500,
    transform: [
      { scaleX: 2 }
    ],
    position: 'absolute',
    top: '18%'
  }
});