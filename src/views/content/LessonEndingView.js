import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  StatusBar
} from "react-native";
import { TrophyProgression } from "./trophy/TrophyProgression";

import { useStore, useDispatch } from "react-redux";
import { useMutation, useQuery } from "react-query";

import { postUserLessonStatus } from "../../services/ProgressionService";
import { valideMainQuizStatusByFormation } from "../../services/FormationService";
import { getTrophyProgressBasedOnModule } from "../../services/TrophyService";

import { getUserNextLesson } from "../../services/ContentService";
import { exitContent, restartContent, nextContent } from "../../actions/contentAction";

const successElements = [
  {
    message: "En plein dans le mille !",
    imgUrl: 'https://media.giphy.com/media/QFypAZbq5lz3i/giphy.gif'
  },
  {
    message: "Tu es au sommet de ton art !",
    imgUrl: 'https://media.giphy.com/media/QXqf43mbeBbYFTy4jR/giphy.gif'
  },
  {
    message: "Ramène la coupe à la maison !",
    imgUrl: 'https://media.giphy.com/media/l0EwYc29XZnLR2pB6/giphy.gif'
  },
  {
    message: "\"We are the champion!\"",
    imgUrl: 'https://media.giphy.com/media/1yjZXySg7tSohpcmUM/giphy.gif'
  },
  {
    message: "Bravo ! Personne ne peu t'arreter !",
    imgUrl: 'https://thumbs.gfycat.com/DizzyInnocentIberianmole-size_restricted.gif'
  },
  {
    message: "Tu es en route pour les étoiles !",
    imgUrl: 'https://media.giphy.com/media/sGBMzyeEzKpySD74qv/giphy.gif'
  },
  {
    message: "Bravo ! Tu écrases tout sur ton passage !",
    imgUrl: 'https://media.giphy.com/media/2a5IGQ1n1Ap1e/giphy.gif'
  },
  {
    message: "Bravo ! Tu déchires tout !",
    imgUrl: 'https://media.giphy.com/media/x47soJwGwN5AYCSvfJ/giphy.gif'
  },
  {
    message: "T'es trop fort !",
    imgUrl: 'https://media.giphy.com/media/xFBnkMvpTM6m4/giphy.gif'
  },
  {
    message: "Wow ! Impressionant !",
    imgUrl: 'https://media.giphy.com/media/QTAVEex4ANH1pcdg16/giphy.gif'
  },
  {
    message: "Quel talent !",
    imgUrl: 'https://media.giphy.com/media/xT77XWum9yH7zNkFW0/giphy.gif'
  },
  {
    message: "Félicitations !",
    imgUrl: 'https://media.giphy.com/media/YRuFixSNWFVcXaxpmX/giphy.gif'
  },
  {
    message: "Franchement... Bien joué !",
    imgUrl: 'https://media.giphy.com/media/mGK1g88HZRa2FlKGbz/giphy.gif'
  },
  {
    message: "Bravo, 1000 points pour Griffondor !",
    imgUrl: 'https://media.giphy.com/media/Swx36wwSsU49HAnIhC/giphy.gif'
  },
  {
    message: "T'es au poil !",
    imgUrl: 'https://media.giphy.com/media/12P29BwtrvsbbW/giphy.gif'
  },
  {
    message: "Houra banana !",
    imgUrl: 'https://media.giphy.com/media/11sBLVxNs7v6WA/giphy.gif'
  },
  {
    message: "Bien joué !",
    imgUrl: 'https://media.giphy.com/media/vcKEsYOdjoCeJRpn95/giphy.gif'
  },
  {
    message: "Et c'est gagnééé !",
    imgUrl: 'https://media.giphy.com/media/geL1pDlmZwpvqVQp6V/giphy.gif'
  },
  {
    message: "Quel feu d'artifice !",
    imgUrl: 'https://media.giphy.com/media/IjmMzurYulKEw/giphy.gif'
  },
  {
    message: "Avec toi est la force de l'orthopédie",
    imgUrl: 'https://media.giphy.com/media/Le5BxgkiTShtS/giphy.gif'
  }
]

const failureElements = [
  {
    message: "Pas tout à fait...",
    imgUrl: 'https://media.giphy.com/media/14aUO0Mf7dWDXW/giphy.gif'
  },


]


export const LessonEndingView = ({ navigation, route }) => {
  const store = useStore()
  const successMessageIndex = Math.floor(Math.random() * successElements.length);
  const stateContent = store.getState().content
  const [nbQuizValidated, setnbQuizValidated] = useState(0)
  const dispatch = useDispatch()
  const saveContentMutation = useMutation(postUserLessonStatus, {
    onError: (error) => {
      throw error
    },
    onSuccess: () => {
      trophyProgression.refetch()
    }
  });
  const valideMainQuiz = useMutation(valideMainQuizStatusByFormation, {
    onError: (error) => {
      throw error
    }
  });
  const [status, setStatus] = useState(false)

  const saveUserAnswer = async (data) => {
    try {
      saveContentMutation.mutateAsync({ status: data.status, id: data.id })
    } catch (error) {
      throw error
    }
  };

  const nextLesson = useQuery('getNextLesson', () => getUserNextLesson(), {
    enabled: false,
    onSuccess: (lesson) => {
      dispatch(nextContent(lesson))
      if (route.name == 'home-content-result') {
        navigation.navigate('home-content', {
          content: lesson
        });
      } else {
        navigation.navigate('formation-content', {
          content: lesson
        });
      }
    },
    onError: (error) => {
      throw error
    }
  });

  const trophyProgression = useQuery('getTrophyProgressBasedOnModule', () => getTrophyProgressBasedOnModule(stateContent.content.module_num), {
    enabled: false
  })

  const handleLessonEnding = async (handleType) => {


    switch (handleType) {
      case 'next':
        nextLesson.refetch()
        break;

      case 'restart':
        dispatch(restartContent())
        navigation.goBack()
        break;

      case 'return':
        dispatch(exitContent())
        navigation.popToTop()
        break;

      default:
        break;
    }
  }


  useEffect(() => {

    var lessonStatus = false

    if (stateContent.quizPassed.length === stateContent.nbQuiz) {
      lessonStatus = true
      stateContent.quizPassed.forEach(element => {
        if (element.status == false) {
          lessonStatus = false
        }
      });
    }
    setStatus(lessonStatus)
    if (stateContent.content.title != 'initial' && stateContent.content.title != 'final') {
      saveUserAnswer({ status: lessonStatus ? 1 : 2, id: stateContent.content.id_content })
    } else {
      const nbQuizValidated = stateContent.quizPassed.filter(elem => elem.status === true).length
      setnbQuizValidated(nbQuizValidated)

      valideMainQuiz.mutate({
        formation_id: 1,
        quiz_type: stateContent.content.title,
        score: nbQuizValidated / stateContent.nbQuiz
      })
    }
  }, [])

  useEffect(() => {
    

  }, [status])






  return <SafeAreaView
    style={[styles.container, styles.AndroidSafeArea]}
  >
    <View style={[styles.resultContainer, {
      backgroundColor: stateContent.content.title == 'initial' || stateContent.content.title == 'final' ?
      'grey'
      : status ? '#0474BB' : '#BB090A'
      }]}>
      <Text style={styles.lessonStatusMessage}>{
        stateContent.content.title == 'initial' || stateContent.content.title == 'final' ?
          "Merci d'avoir complété le quiz " + stateContent.content.title
          :
          status ? successElements[successMessageIndex].message : failureElements[0].message
      }</Text>

      {
        stateContent.content.title != 'initial' && stateContent.content.title != 'final' ?
          <Image
            source={{
              uri: status ? successElements[successMessageIndex].imgUrl : failureElements[0].imgUrl
            }}
            style={[styles.image, {
              width: Dimensions.get('screen').width / 2,
              height: Dimensions.get('screen').width / 2,
            }]}
          />
          : <View>
            <Text style={{fontSize: 30, color: '#ffffff', alignSelf: 'center'}}>Ta note est de</Text>
            <Text style={{fontSize: 80, fontWeight: 'bold', color: '#ffffff', alignSelf: 'center'}}>{nbQuizValidated + "/" + stateContent.content.nbQuiz}</Text>
          </View>
      }


      {
        status ?
          <TrophyProgression trophies={trophyProgression.data} />
          : null
      }

      {
        stateContent.content.title != 'initial' && stateContent.content.title != 'final' ?
          <View style={[styles.navigationContainer]}>
            <TouchableOpacity
              style={[styles.navigationBox]}
              onPress={() => handleLessonEnding('return')}
            >
              <Image
                source={require('../../../assets/formation/arrow.png')}
                style={[styles.navigationImg, {
                  transform: [
                    { rotateZ: "180deg" }
                  ]
                }]}
              />
              <Text style={styles.navigationTxt}>Retour</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navigationBox}
              onPress={() => handleLessonEnding('restart')}
            >
              <Image
                source={require('../../../assets/formation/restart.png')}
                style={styles.navigationImg}
              />

              <Text style={styles.navigationTxt}>Recommencer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navigationBox}
              onPress={() => handleLessonEnding('next')}
            >

              <Image
                source={require('../../../assets/formation/arrow.png')}
                style={styles.navigationImg}
              />
              <Text style={styles.navigationTxt}>Leçon suivante</Text>
            </TouchableOpacity>

          </View>
          : <TouchableOpacity
            style={[{ width: '60%', height: 60, backgroundColor: '#E75A08', alignItems: 'center', justifyContent: 'center' }]}
            onPress={() => handleLessonEnding('return')}
          >
            <Text style={[styles.navigationTxt, { color: '#ffffff', fontSize: 15 }]}>Quitter</Text>
          </TouchableOpacity>
      }
    </View>

  </SafeAreaView>
}

const styles = StyleSheet.create({
  AndroidSafeArea: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center'
  },
  resultContainer: {
    width: '100%',
    height: '95%',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  lessonStatusMessage: {
    fontSize: 40,
    fontWeight: 'bold',
    color: "#ffffff",
    width: '90%',
    textAlign: 'center'
  },
  starBox: {
    alignItems: 'center',
  },
  image: {
    marginBottom: 20,

  },
  navigationContainer: {
    flexDirection: 'row',
    width: '80%',
    height: 50,
  },
  navigationBox: {
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    width: '80%',
    height: 30,
  },
  navigationImg: {
    resizeMode: 'contain',
    height: '100%',
    width: '100%',
  },
  navigationTxt: {
    fontSize: 12,
    color: '#ffffff',
    marginTop: 10
  }
});