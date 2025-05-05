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

import { useQuery, useMutation } from "react-query";

import { fetchLessonContent } from "../../services/ContentService";
import { saveLogtimeOnLesson } from "../../services/LogsService";

import { exitContent, runContent } from "../../actions/contentAction";

import { getCurrentDate } from "../../utils";
import { ContentFactory } from './components/ContentFactory'
import { LoadingContent } from "../../component/LoadingContent";


import { useSelector } from "react-redux";
import { selectIsFinish, selectIsRunning } from "../../reducers/contentReducer";

import { SessionEventContent } from "../../utils/myTypes"
import { AppStore } from "../../store";
import { useAppDispatch } from "../../hooks/storeHooks";


export function ContentDisplayer({ route, navigation }) {
  var { content, formation, type, demoMode } = route.params;
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
  const xmlContent = useQuery(['Content', 'GET', 'lessonContent', content.s3_path], () => fetchLessonContent(content.s3_path + "/" + content.title + "/content.xml"), {
    onSuccess: (xml) => {
      initContent(xml)
    }
  });

  const mutation = useMutation(saveLogtimeOnLesson);

  const saveLogs = async (data: SessionEventContent) => {
    // var inn = new Date(log.login)
    // var out = new Date(log.logout)
    // const timePassed = (out - inn) / 1000



    // await mutation.mutateAsync(log)
    // if (timePassed >= 10) {
    // }
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
    // if (content.type == 'lesson' && content.title != 'initial' && content.title != 'final') { // tmp handling of main quiz in the formation
    if (formation && type == "lesson") { // tmp handling of main quiz in the formation
      launchDate = getCurrentDate()

      const appStateListener = AppState.addEventListener("change", nextAppState => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          // launchDate = getCurrentDate()
        } else if (appState.current == "active" && (nextAppState === "background" || nextAppState == "inactive")) {
          // saveLogs({
          //   login: launchDate,
          //   logout: getCurrentDate(),
          //   contentId: content.id_content,
          //   idUserRegisteredFormation: formation.id
          // })
        }

        appState.current = nextAppState;
      })

      navigation.addListener('blur', (e) => {
        // saveLogs({
        //   login: launchDate,
        //   logout: getCurrentDate(),
        //   contentId: content.id_content,
        //   idUserRegisteredFormation: formation.id
        // })
      })
      navigation.addListener('focus', (e) => {
        // launchDate = getCurrentDate()
      })

      return () => {
        appStateListener.remove()
      }
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
