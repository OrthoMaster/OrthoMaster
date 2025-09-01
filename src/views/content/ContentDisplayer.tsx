import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  AppState,
  ScrollView,
  View,
  RefreshControl,
  Image,
  TouchableOpacity,
  SafeAreaView,
  InteractionManager
} from 'react-native';

import { useQuery } from "@tanstack/react-query";

import { fetchLessonContent } from "../../services/ContentService";

import { exitContent, runContent } from "../../actions/contentAction";

import { getCurrentDate } from "../../futils";
import { ContentFactory } from './components/ContentFactory'
import { LoadingContent } from "../../component/LoadingContent";


import { useSelector } from "react-redux";
import { selectIsFinish, selectIsRunning } from "../../reducers/contentReducer";

import { SessionEventContent } from "../../utils/myTypes"
import { useAppDispatch } from "../../hooks/storeHooks";
import { saveEvent } from "../../services/SessionEventService";

import { useGlobal } from '../../component/GlobalContext';
import { useGetUser } from '../../hooks/useGetUser.hook';
import { AdServingModalMediaAccess } from "../flash/ads/AdServingModalMediaAccess";

import { UseCaptureGuard } from '../../component/captureGuard/useCaptureGuard';

export function ContentDisplayer({ route, navigation }) {
  var { content, formation, demoMode } = route.params;
  const dispatch = useAppDispatch()

  const appState = useRef(AppState.currentState);
  const contentScrollRef = useRef<ScrollView>(null);
  var launchDate = null;
  const [refreshing, setRefreshing] = useState(false)

  const { data: user } = useGetUser()

  const lessonIsFinish = useSelector(selectIsFinish)
  const contentIsRunning = useSelector(selectIsRunning)

  const initContent = async (xmlObject) => {
    let nbQuiz = 0
    xmlObject.children.forEach(element => {
      if (element.name === "quiz")
        nbQuiz++
    });
    dispatch(runContent(content, nbQuiz))
  };
  const xmlContent = useQuery({
    queryKey: ['Content', 'GET', 'lessonContent', content.s3_path],
    queryFn: () => fetchLessonContent(content.s3_path + "/" + content.title + "/content.xml")
  });

  const saveLogs = async (data: SessionEventContent) => {
    saveEvent("content_view", data)
  };

  useEffect(() => {
    if (lessonIsFinish) {
      navigation.push(route.name == 'home-content' ? 'home-content-result' : 'formation-content-result', {
        formation: formation,
        demoMode: demoMode
      })
    } else {
      if (contentScrollRef.current) {
        contentScrollRef.current.scrollTo({
          y: 0,
          animated: true
        })
      }
    }
  }, [lessonIsFinish])

  useEffect(() => {
    if (xmlContent.isSuccess && xmlContent.data)
      initContent(xmlContent.data)
  }, [xmlContent.isSuccess, xmlContent.data])

  useEffect(() => {
    launchDate = getCurrentDate()
    const appStateListener = AppState.addEventListener("change", nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        launchDate = getCurrentDate()
      } else if (appState.current == "active" && (nextAppState === "background" || nextAppState == "inactive")) {
        saveLogs({
          started_at: launchDate,
          ended_at: getCurrentDate(),
          content_id: content.id_content,
          id_user_registered_formation: formation ? formation.id : null
        })
      }

      appState.current = nextAppState;
    })

    navigation.addListener('blur', (e) => {
      saveLogs({
        started_at: launchDate,
        ended_at: getCurrentDate(),
        content_id: content.id_content,
        id_user_registered_formation: formation ? formation.id : null
      })
    })
    navigation.addListener('focus', (e) => {
      launchDate = getCurrentDate()
    })

    return () => {
      appStateListener.remove();
    }
  }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    xmlContent.refetch()
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  /**
    * Handle Ads
    * Show ads with students
    * @author Francis
    */
  const ADS_WAIT_TIME = 60 * 20 // seconds - 20 mins
  const { globalData, setGlobalData } = useGlobal();
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const showAdsRef = useRef(false);
  const [showAds, setShowAds] = useState(false);

  /**
   * Check ads showable
   * Student and out of time
   * @author Francis
   * @returns 
   */
  const checkAdsShowable = () => {
    // Get ads show last time
    const adsShowNextTime = globalData.adsShowNextTime;
    const now = Date.now();

    if (!showAds) {

      // User is student
      const adsShowable = (user as any).is_student ? true : false;

      // If not in case showable
      if (!adsShowable) return;

      if (remainingTime <= 0) {
        // Show ads if first time or out of saved next time
        if (!adsShowNextTime || now >= adsShowNextTime) {
          setShowAds(true);
          setRemainingTime(0);

          return;
        }
      }
    }

    // On waiting
    const timeLeft = Math.ceil((adsShowNextTime - now) / 1000);
    setShowAds(false);
    setRemainingTime(timeLeft);

    return;
  }

  useEffect(() => {
    // Wait render completed
    const task = InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        // Show ads
        checkAdsShowable()
      }, 500);
    });

    return () => task.cancel();
  }, []);

  /**
   * Handle action close Ads
   * @author Francis
   */
  const handeAdsClose = (callback?: () => void) => {
    showAdsRef.current = false;
    setShowAds(false);
    callback?.();
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

    return;
  }

  /**
   * Handle timing when stay screen
   * @author Francis
   */
  const startAdsTiming = (timeInSeconds: number) => {
    const interval = setInterval(() => {
      setShowAds(true);
      clearInterval(interval);
    }, timeInSeconds * 1000);

    return;
  };

  useEffect(() => {
    // Return if unset timing
    if (remainingTime <= 0) { return; };

    // Run timer
    startAdsTiming(remainingTime);
  }, [remainingTime]);

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
        onClose={() => {
          handeAdsClose(() => {
            setTimeout(() => {
              navigation.goBack()
            }, 100);
          })
        }}
        grantAccess={handleAdsAfterWatched}
      />
    )
  }

  if (lessonIsFinish || contentIsRunning == false) return
  return (
    <SafeAreaView style={styles.container}>
      <UseCaptureGuard>
        <Text
          style={{
            fontWeight: 'bold',
            fontSize: 18,
            textAlign: 'center',
            paddingVertical: 16,
            marginHorizontal: 48
          }}
          numberOfLines={1}
          ellipsizeMode="tail">{content.title}</Text>
        <View
          style={{
            flex: 1,
            width: '100%',
            position: 'relative'
          }}>
          <ScrollView
            overScrollMode="never"
            contentContainerStyle={styles.scrollContainer}
            ref={contentScrollRef}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {xmlContent.isLoading ? <LoadingContent state={true} onRetry={() => { }} /> : <ContentFactory component={xmlContent.data} contentInfos={content} />}
          </ScrollView>

          {
            (demoMode == true && content.demo_access == false) &&
            <View style={{
              backgroundColor: "rgba(0, 0,0, 0.8)",
              position: 'absolute',
              top: 0, left: 0,
              height: '100%', width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20
            }}>
              <Image
                source={require("../../../assets/locker-icon.png")}
                style={{
                  height: 75,
                  objectFit: 'contain',
                  margin: 10
                }}
              />
              <Text style={{
                fontSize: 20,
                fontWeight: 'bold',
                margin: 10,
                color: '#fff'
              }}>Ooops... </Text>
              <Text style={{
                textAlign: 'left',
                margin: 10,
                color: '#fff'
              }}>
                Ce contenu fait partie d'une formation que vous pouvez débloquer en suivant le lien ci-dessous :
              </Text>
              <TouchableOpacity
                style={{
                  padding: 10,
                  backgroundColor: "#ffaf31",
                  borderRadius: 5,
                  margin: 10
                }}
                onPress={() => {
                  navigation.navigate("Formation", {
                    screen: "formation-home",
                    params: {
                      formation2Unlock: formation.id_formation
                    }
                  })
                }}
              >
                <Text>Débloquer le contenu</Text>
              </TouchableOpacity>
            </View>
          }

        </View>

        {/* Ads overlay */}
        <AdsOverlay />
      </UseCaptureGuard>
    </SafeAreaView>
  )
}

var styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    flex: 1,
  },
  scrollContainer: {

  },
  buttonContainer: {
    backgroundColor: '#E85C0A',
    width: '70%',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 5
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700'
  }
});
