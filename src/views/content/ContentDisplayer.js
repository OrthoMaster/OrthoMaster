import React, { useState, useEffect, useRef, useCallback } from "react";
import { StyleSheet, Text, AppState, ScrollView, View, RefreshControl } from 'react-native';
import { ContentHeader } from "./ContentHeader";

import { useQuery, useMutation } from "react-query";

import { fetchLessonContent } from "../../services/ContentService";
import { saveLogtimeOnLesson } from "../../services/LogsService";

import { exitContent, runContent } from "../../actions/contentAction";

import { getCurrentDate } from "../../utils";
import { ContentFactory } from './components/ContentFactory'
import { LoadingContent } from "../../component/LoadingContent";


import { useDispatch, useSelector } from "react-redux";
import { selectIsFinish, selectIsRunning } from "../../reducers/contentReducer";

export function ContentDisplayer({ route, navigation }) {
  var { content } = route.params;
  const dispatch = useDispatch();
  const appState = useRef(AppState.currentState);
  const contentScrollRef = useRef();
  var launchDate = null;
  const routes = navigation.getState()?.routes;
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

  const xmlContent = useQuery(['fetchLessonContent', content.id_content], () => fetchLessonContent(content.s3_path + '/' + content.title + '/content.xml'), {
    onSuccess: (xml) => {
      initContent(xml)
    },
    onError: (error) => {
      throw error
    }
  });

  const mutation = useMutation(saveLogtimeOnLesson, {
    onError: (error) => {
      throw error
    }
  });

  const saveLogs = async (log) => {
    await mutation.mutateAsync(log)
    console.log('[ LOG lesson ]:', log)
  };


  useEffect(() => {
    if (lessonIsFinish) {
      if (route.name == 'home-content') {
        navigation.push('home-content-result')
      } else {
        navigation.push('formation-content-result')
      }
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
    if (content.type == 'lesson' && content.title != 'initial' && content.title != 'final') { // tmp handling of main quiz in the formation
      launchDate = getCurrentDate()


      const appStateListener = AppState.addEventListener("change", nextAppState => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          launchDate = getCurrentDate()

        } else if (nextAppState === "background") {
          saveLogs({
            login: launchDate,
            logout: getCurrentDate(),
            contentId: content.id_content
          })
        }

        appState.current = nextAppState;
      })

      navigation.addListener('blur', (e) => {
        saveLogs({
          login: launchDate,
          logout: getCurrentDate(),
          contentId: content.id_content
        })
      })
      navigation.addListener('focus', (e) => {
        launchDate = getCurrentDate()
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
    <View style={styles.container}>
      <ContentHeader
        title={content.title}
        onReturn={() => {
          dispatch(exitContent())
          xmlContent.remove()   // by removing query, caching is disable on content display
          if (routes.length > 3 && content.type == 'lesson') {
            navigation.pop(routes.length - 2)
          } else {
            navigation.goBack()
          }
        }}
      />
      <ScrollView
      overScrollMode="never"
        contentContainerStyle={styles.scrollContainer}
        ref={contentScrollRef}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {xmlContent.isLoading ? <LoadingContent /> : <ContentFactory component={xmlContent.data} contentInfos={content} />}

      </ScrollView>

    </View>
  )
}

var styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    flex: 1
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
