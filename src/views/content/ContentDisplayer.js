import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, Text, AppState, ScrollView, View, SafeAreaView } from 'react-native';
import { ContentHeader } from "./ContentHeader";

import { useQuery, useMutation } from "react-query";

import { fetchLessonContent } from "../../services/ContentService";
import { saveLogtimeOnLesson } from "../../services/LogsService";

import { exitContent, runContent } from "../../actions/contentAction";
import { logout } from "../../actions/auth";

import { getCurrentDate } from "../../utils";
import { ContentFactory } from './components/ContentFactory'
import { LoadingView } from "../LoadingView";


import { useDispatch, useSelector } from "react-redux";
import { selectIsFinish, selectIsRunning } from "../../reducers/contentReducer";

export function ContentDisplayer({ route, navigation }) {
  var { content } = route.params;
  const dispatch = useDispatch();
  const appState = useRef(AppState.currentState);
  const contentScrollRef = useRef();
  var launchDate = null;
  const routes = navigation.getState()?.routes;

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
 
  const xmlContent = useQuery('fetchLessonContent', () => fetchLessonContent(content), {
    onSuccess: (xml) => {
      initContent(xml)
    },
    onError: (error) => {
      console.log(error);
      if (error.response.data == 'token_not_valid') {
        dispatch(logout())
      }
    }
  });

  const mutation = useMutation(saveLogtimeOnLesson, {
    onError: (error) => {
      if (error.response.data == 'token_not_valid') {
        dispatch(logout())
      }
    }
  });

  const saveLogs = async (log) => {
    try {
      await mutation.mutateAsync(log)
    } catch (error) {
      console.error(error)
      Sentry.Native.captureException(e);
    } finally {
      console.log('[ LOG ] lesson:', log)
    }
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

      const lessonState = AppState.addEventListener("change", nextAppState => {
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
        //lessonState.remove();
        stateChange.remove();
      }
    }
  }, [])

  useEffect(() => {
    xmlContent.refetch()
  }, [content])
  

  if (xmlContent.isLoading) return <LoadingView />
  if (xmlContent.error) return <Text>Error</Text>

  if (contentIsRunning) {
    return (
      <View style={styles.container}>
        <ContentHeader
          title={content.title}
          onReturn={() => {
            dispatch(exitContent())
            if (routes.length > 3) {
              navigation.pop(routes.length - 2)
            } else {
              navigation.goBack()
            }
          }}
        />
        <ScrollView contentContainerStyle={styles.scrollContainer} ref={contentScrollRef} >
          <ContentFactory component={xmlContent.data} />
        </ScrollView>

      </View>
    )
  } else {
    return <LoadingView />
  }
}

var styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#ffffff',
    paddingBottom: 100
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
