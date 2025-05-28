import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  StatusBar,
  Platform
} from "react-native";
import { TrophyProgression } from "./trophy/TrophyProgression";

import { useStore, useDispatch } from "react-redux";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { postUserLessonStatus } from "../../services/ProgressionService";
import { updateUserFormationMainQuizStatus } from "../../services/FormationService";
import { getTrophyProgressBasedOnModule } from "../../services/TrophyService";

import { getNextLesson } from "../../services/ContentService";
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
    message: "Bravo ! Personne ne peut arrêter !",
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
  var { formation, demoMode } = route.params



  const isDemo = demoMode

  const store = useStore()

  const [successMessageIndex, setsuccessMessageIndex] = useState(Math.floor(Math.random() * successElements.length))
  const stateContent = store.getState().content

  const [nbQuizValidated, setnbQuizValidated] = useState(0)
  const dispatch = useDispatch()
  const saveContentMutation = useMutation({ mutationFn: postUserLessonStatus });
  const queryClient = useQueryClient()
  const trophyProgression = useQuery({
    queryKey: ['Lesson', 'GET', 'trophyProgressBasedOnModule'],
    queryFn: () => getTrophyProgressBasedOnModule(stateContent?.content?.module_num),
    enabled: stateContent.content && stateContent?.content?.title != "final" && stateContent?.content?.title != "initial"
  })


  const valideMainQuiz = useMutation({ mutationFn: updateUserFormationMainQuizStatus });
  const [status, setStatus] = useState(false)

  const saveUserAnswer = async (data) => {
    saveContentMutation.mutateAsync({ status: data.status, id: data.id, userFormation: formation.id })
  };

  const { data: nextLesson, isFetching, isLoading } = useQuery({
    queryKey: ['Lesson', 'GET', 'nextLesson', stateContent?.content?.id_content],
    queryFn: () => getNextLesson(stateContent?.content?.module_num, stateContent?.content?.order, formation.id_formation),
    enabled: route.name != 'home-content-result' && stateContent.content && stateContent?.content?.title != "final" && stateContent?.content?.title != "initial"
  });


  const handleLessonEnding = async (handleType) => {

    switch (handleType) {
      case 'next':
        if (nextLesson) {
          dispatch(nextContent(nextLesson))
          if (route.name == 'home-content-result') {
            navigation.navigate('home-content', {
              content: nextLesson,
              formation: formation,
              type: "lesson",
              demoMode: demoMode
            });
          } else {
            navigation.navigate('formation-content', {
              content: nextLesson,
              formation: formation,
              type: "lesson",
              demoMode: demoMode
            });
          }
        }
        break;

      case 'restart':
        dispatch(restartContent())
        navigation.goBack()
        break;

      case 'return':
        dispatch(exitContent())
        queryClient.invalidateQueries({ queryKey: ["user-formations", formation.id] })
        queryClient.invalidateQueries({ queryKey: ["user-formations"] })
        queryClient.invalidateQueries({ queryKey: ['formation-modules', formation.id_formation] })
        if (route.name == 'home-content-result') {
          navigation.popToTop()
        } else {

          navigation.popTo("formation-modules", {
            userFormationId: formation.id,
            demoMode: demoMode
          })
        }
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
    if (stateContent?.content?.title != 'initial' && stateContent?.content?.title != 'final') {

      saveUserAnswer({
        status: lessonStatus ? 1 : 2,
        id: stateContent?.content?.id_content
      })
    } else {
      const nbQuizValidated = stateContent.quizPassed.filter(elem => elem.status === true).length
      setnbQuizValidated(nbQuizValidated)

      valideMainQuiz.mutate({
        idUserFormation: formation.id,
        quizType: stateContent?.content?.title,
        grade: nbQuizValidated / stateContent?.nbQuiz
      })
    }
  }, [])


  return <SafeAreaView
    style={[styles.container, styles.AndroidSafeArea]}
  >
    <View style={[styles.resultContainer, {
      backgroundColor: stateContent?.content?.title == 'initial' || stateContent?.content?.title == 'final' ?
        'grey'
        : status ? '#0474BB' : '#BB090A'
    }]}>
      <Text style={styles.lessonStatusMessage}>{
        stateContent?.content?.title == 'initial' || stateContent?.content?.title == 'final' ?
          "Merci d'avoir complété le quiz " + stateContent?.content?.title
          :
          status ? successElements[successMessageIndex].message : failureElements[0].message
      }</Text>

      {
        stateContent?.content?.title != 'initial' && stateContent?.content?.title != 'final' ?
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
            <Text style={{ fontSize: 30, color: '#ffffff', alignSelf: 'center' }}>Ta note est de</Text>
            <Text style={{ fontSize: 80, fontWeight: 'bold', color: '#ffffff', alignSelf: 'center' }}>{nbQuizValidated + "/" + stateContent.nbQuiz}</Text>
          </View>
      }


      {
        status ?
          <TrophyProgression trophies={trophyProgression.data} />
          : null
      }

      {
        stateContent?.content?.title != 'initial' && stateContent?.content?.title != 'final' ?
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
            {
              nextLesson ?
                <TouchableOpacity
                  style={styles.navigationBox}
                  onPress={() => {
                    if (isDemo == false) {
                      handleLessonEnding('next')
                    }
                  }}
                >


                  {
                    isDemo &&
                    <View style={{
                      alignItems: 'center',
                      position: 'absolute',
                      width: '100%', height: '100%',
                      zIndex: 1
                    }}>
                      <Image
                        source={require('../../../assets/locker-icon.png')}
                        style={{ width: 25, height: 25 }}
                      />
                      <Text style={{ fontWeight: 'bold', color: '#fff', fontSize: 12 }}>Démo</Text>
                    </View>
                  }

                  <View style={{ alignItems: 'center', opacity: isDemo ? 0.2 : 1 }}>
                    <Image
                      source={require('../../../assets/formation/arrow.png')}
                      style={styles.navigationImg}
                    />
                    <Text style={styles.navigationTxt}>Leçon suivante</Text>
                  </View>
                </TouchableOpacity>
                : null
            }


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
    fontSize: 20,
    fontWeight: 'bold',
    color: "#ffffff",
    width: '90%',
    textAlign: 'center'
  },
  starBox: {
    alignItems: 'center',
  },
  image: {

  },
  navigationContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  navigationBox: {
    flex: 1,
    alignItems: 'center',
  },
  navigationImg: {
    resizeMode: 'contain',
    height: 25,
    width: 25,
  },
  navigationTxt: {
    fontSize: 12,
    color: '#ffffff',
    marginTop: 10
  }
});