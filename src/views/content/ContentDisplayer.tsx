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
  SafeAreaView
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
import WebView from "react-native-webview";


export function ContentDisplayer({ route, navigation }) {
  var { content, formation, demoMode } = route.params;
  const dispatch = useAppDispatch()

  const appState = useRef(AppState.currentState);
  const contentScrollRef = useRef<ScrollView>(null);
  var launchDate = null;
  const [refreshing, setRefreshing] = useState(false)

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
    if (xmlContent.isSuccess && xmlContent.data)
      initContent(xmlContent.data)
  }, [xmlContent.isSuccess, xmlContent.data])


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
      appStateListener.remove()
    }
  }, [])


  const onRefresh = useCallback(() => {
    setRefreshing(true);
    xmlContent.refetch()
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  if (lessonIsFinish || contentIsRunning == false) return

  return (
    <SafeAreaView style={styles.container}>

      <Text style={{
        fontWeight: 'bold',
        fontSize: 18,
        textAlign: 'center',
        paddingVertical: 15,
        marginLeft: 50
      }} numberOfLines={1}>
        {content.title}
      </Text>
      <View style={{
        flex: 1,
        width: '100%',
        position: 'relative'
      }}>
        {/* <ScrollView
          overScrollMode="never"
          contentContainerStyle={styles.scrollContainer}
          ref={contentScrollRef}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
        </ScrollView> */}
        {/* {xmlContent.isLoading ? <LoadingContent state={true} onRetry={() => { }} /> : <ContentFactory component={xmlContent.data} contentInfos={content} />} */}
        {xmlContent.isLoading ?
          <LoadingContent state={true} onRetry={() => { }} />
          : <WebView
            source={require('../../../contenu.html')}
            style={{ flex: 1 }}
            onMessage={(data)=>console.log(data)}
          />
        }

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
