import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Animated,
    PanResponder,
    FlatList,
    ScrollView,
    SafeAreaView,
    Image, useWindowDimensions,
} from "react-native"
import React, { useEffect, useState } from "react"
import { useQuery } from "react-query"
import { getAPIqueChoisirStep } from "../../../services/tools/QueChoisirService";
import BottomArrow from '../../../../assets/queChoisir/bottom_arrow.svg'
import UpperArrow from '../../../../assets/queChoisir/upper_arrow.svg'
import { LinearGradient } from "expo-linear-gradient";


const ResponseButton = ({ element, onPress, history }) => {
    const [pressed, setPressed] = useState(false)
    const [isDisplay, setIsDisplay] = useState(true)

    useEffect(() => {
        if (element.display_if) {
            evaluateExpression(element.display_if, history)
        .then((val) => {
                    setIsDisplay(val)

                })
        }
    }, [])

    if (!isDisplay) return null
    return (
            <TouchableOpacity
                key={element.id}
                style={[styles.rectangleButton, { borderColor: pressed ? 'orange' : 'black'}]}
                onPress={() => {
                    onPress({
                        response: element,
                        status: !pressed
                    });
                    setPressed(!pressed);
                }}
            >
                <Text style={styles.buttonTextQ}>{element.response}</Text>
            </TouchableOpacity>
)
}

const isLetter = (char) => {
    return char != null && char.length === 1 && char.match(/[a-z]/i) ? true : false;
}

const isNumber = (char) => {
    return char != null && char.length === 1 && char.match(/[0-9]/i) ? true : false;
}

const isInHistory = (ref, value, history) => {
    let isIn = false
    history.forEach(historyElement => {
        if (historyElement.question.ref == ref) {
            historyElement.responses.forEach(response => {
                if (response.response.value == value) {
                    isIn = true
                    return
                }
            });
        }
    });
    return isIn
}

const evaluateExpression = async (exp, userHistory) => {
    var i = 0

    let toEvaluate = exp

    let refToCheck = ""
    let valueToCheck = ""


    while (i < exp.length) {

        if (isLetter(exp[i])) {
            refToCheck += exp[i]
        }
        if (isNumber(exp[i])) {
            valueToCheck += exp[i]
        }

        if (i + 1 == exp.length || (!isLetter(exp[i + 1]) && !isNumber(exp[i + 1]))) {
            if (refToCheck.length > 0 && valueToCheck.length > 0) {
                var re = new RegExp(`\\b${refToCheck + valueToCheck}\\b`, 'g')
                if (isInHistory(refToCheck, valueToCheck, userHistory)) {
                    toEvaluate = toEvaluate.replace(re, true)
                } else {
                    toEvaluate = toEvaluate.replace(re, false)
                }

            }


            refToCheck = ""
            valueToCheck = ""
        }

        i++
    }
    return eval(toEvaluate)
}


export const QueChoisirView = ({ navigation, route }) => {
    const [questionIndex, setQuestionIndex] = useState(0)
    const [globalSteps, setGlobalSteps] = useState(null)
    const [userHistory, setUserHistory] = useState([])
    const [userSelection, setUserSelection] = useState([])

    const getStep = useQuery(['Tools', 'GET', 'queChoisirStep', "Ceinture lombaire"], () => getAPIqueChoisirStep('Ceinture lombaire'), {
        onSuccess: (data) => {
            setGlobalSteps(data);
        },
        onError: (err) => {
            //console.log(err.response);
        }
    })

    if (globalSteps === null) return;
    return (<SafeAreaView style={styles.container}>

        <Image
            source={require('../../../../assets/queChoisir/tmp.png')}
            style={styles.image}
        />
            <Text style={styles.heading}>{globalSteps[questionIndex].question.question}</Text>
            <ScrollView centerContent={true} style={styles.quizScroll} contentContainerStyle={{ alignItems: 'center' }}>
                <View style={[styles.quizContainer]}>
                {globalSteps[questionIndex].responses?.map((button, index) => {
                        return <ResponseButton element={button} key={globalSteps[questionIndex].question.ref + button.value} history={userHistory}
                                               onPress={(value) => {
                                                   if (value.status) {
                                                       setUserSelection(userSelection => [...userSelection, value])
                                                   } else {
                                                       var newSelection = userSelection.filter(function (obj) {
                                                           return obj.response.id !== value.response.id;
                                                       });
                                                       setUserSelection(newSelection)
                                                   }
                                               }}
                        />
                })}
                    </View>
                </ScrollView>
        <View style={styles.arrowContainer}>
            <LinearGradient
                colors={['#E8764A', '#EC4C70']}
                style={styles.bottom_arrow}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
            <TouchableOpacity style={styles.bottom_arrow}
                              onPress={() => {
                                  if (userHistory.length > 0) {
                                      setQuestionIndex(userHistory[userHistory.length - 1].question.ref.charCodeAt(0) - 65);
                                      userHistory.pop();
                                  }
                              }}
            >
                    <UpperArrow height={50} width={50}/>
            </TouchableOpacity>
            </LinearGradient>
            <LinearGradient
                colors={['#E8764A', '#EC4C70']}
                style={styles.bottom_arrow}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
            <TouchableOpacity style={styles.bottom_arrow}
                              onPress={() => {
                                  if (userSelection.length > 0) {
                                      let exp = userSelection[userSelection.length - 1].response.skip_to_if

                                      setUserHistory(userHistory => [...userHistory, {
                                          question: globalSteps[questionIndex].question,
                                          responses: userSelection
                                      }])
                                      if (exp) {
                                          var splitedExp = exp.split(':')
                                          evaluateExpression(splitedExp[1], userHistory)
                                              .then((val) => {
                                                  if (val) {
                                                      setQuestionIndex(splitedExp[0].charCodeAt(0) - 65)
                                                  } else {
                                                      setQuestionIndex(userSelection[userSelection.length - 1].response.next_q_ref.charCodeAt(0) - 65);
                                                  }
                                              })
                                      } else {
                                          setQuestionIndex(userSelection[userSelection.length - 1].response.next_q_ref.charCodeAt(0) - 65);
                                      }
                                      setUserSelection([])
                                  }
                              }}
            >
                <BottomArrow height={50} width={50}></BottomArrow>
            </TouchableOpacity>
            </LinearGradient>
        </View>
    </SafeAreaView>)
}

const styles = StyleSheet.create({
    arrowContainer:{
        width: '100%',
        flexWrap:'wrap',
        flexDirection: 'row',
        justifyContent:'space-evenly',
        maxHeight: '35%',
    },
    rectangleButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginVertical: 5,
        minHeight: 100,
        width: '47%',
        justifyContent:'center',
        borderWidth: 1,
    },
    quizContainer:{
        width: '100%',
        flexWrap:'wrap',
        flexDirection: 'row',
        justifyContent:'space-evenly',
    },
    buttonTextQ: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333333',
        justifyContent: 'center',
    },
    quizScroll: {
        width: "100%",
    },

    container: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    image: {
        width: "90%",
        marginBottom: 20,
        borderRadius: 16,
        resizeMode: "cover",
        height: "30%",
    },
    heading: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },

    button: {
        backgroundColor: 'blue',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    bottom_arrow: {
        borderRadius: 50,
        height: "60%",
        width: "20%",
        alignItems:'center',
        justifyContent:'center',
    },
})