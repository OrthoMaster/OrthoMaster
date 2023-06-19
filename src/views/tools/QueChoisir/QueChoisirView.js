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
import React, { useEffect, useState, useCallback } from "react"
import { useQuery } from "react-query"
import { getAPIqueChoisirStep } from "../../../services/tools/QueChoisirService";
import {pushKeySchema} from "expo-cli/build/credentials/credentials";

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
            style={[styles.rectangleButton, { backgroundColor: pressed ? 'orange' : 'grey' }]}
            onPress={() => {
                onPress({
                    response: element,
                    status: !pressed
                })
                setPressed(!pressed)
            }}
        >
            <Text style={[styles.buttonTextQ, {backgroundColor: 'red'}]}>{element.response}</Text>
        </TouchableOpacity>
    )
}


export const QueChoisirView = ({ navigation, route }) => {
    const [nextQuestionRef, setNextQuestionRef] = useState('A')
    const [currentQuestion, setCurrentQuestion] = useState(null)
    const [currentResponses, setCurrentResponses] = useState(null)
    const [userHistory, setUserHistory] = useState([])

    const [userSelection, setUserSelection] = useState([])

    const [responsesCounter, setResponsesCounter] = useState(null);

    const windowWidth = useWindowDimensions().width;
    const maxWidth = Math.min(300, windowWidth * 0.9);

    const getStep = useQuery(['Tools', 'GET', 'queChoisirStep', nextQuestionRef], () => getAPIqueChoisirStep(nextQuestionRef, 'Ceinture lombaire'), {
        onSuccess: (data) => {
            setCurrentQuestion(data.question)
            setCurrentResponses(data.responses)
        },
        onError: (err) => {
            //console.log(err.response);
        }
    })
    function extractRefAndId(object) {
        const { ref } = object.question;
        const { value } = object.responses[0].response;
        return ref + value;
    }
    const getResponseNumber = (elements, history) => {
        let extractedData = [];
        extractedData.push(history.map((item) => {return extractRefAndId(item)}));
        console.log(extractedData);
    }

    return (<SafeAreaView style={styles.container}>

        <Image
            source={require('../../../../assets/queChoisir/tmp.png')}
            style={styles.image}
        />
            <Text style={styles.heading}>Première question</Text>
            {/*<FlatList*/}
            {/*    data={currentResponses}*/}
            {/*    renderItem={(item) => <ResponseButton element={item.item} key={item.index} history={userHistory} style={styles.buttonQ}*/}
            {/*        onPress={(value) => {*/}
            {/*            if (value.status) {*/}
            {/*                setUserSelection(userSelection => [...userSelection, value])*/}
            {/*            } else {*/}

            {/*                var newSelection = userSelection.filter(function (obj) {*/}
            {/*                    return obj.response.id !== value.response.id;*/}
            {/*                });*/}
            {/*                setUserSelection(newSelection)*/}

            {/*            }*/}
            {/*        }}*/}
            {/*    />}*/}
            {/*/>*/}
            <ScrollView centerContent={true} style={styles.quizScroll} contentContainerStyle={{ alignItems: 'center' }}>
                <View style={[styles.quizContainer]}>
                {currentResponses?.map((button, index) => {
                    getResponseNumber(currentResponses, userHistory);
                    return <ResponseButton element={button} key={index} history={userHistory}
                                           onPress={(value) => {
                                               if (value.status) {
                                                   setUserSelection(userSelection => [...userSelection, value])

                                               } else {
                                                   var newSelection = userSelection.filter(function (obj) {
                                                       return obj.response.id !== value.response.id;
                                                   });
                                                   console.log(newSelection)
                                                   setUserSelection(newSelection)
                                               }
                                           }}
                    />
                })}
                    </View>
                </ScrollView>
    <TouchableOpacity style={{ backgroundColor: 'grey', width:50, height:75 }}
                      onPress={() => {
                          if (userSelection.length > 0) {
                              let exp = userSelection[userSelection.length - 1].response.skip_to_if

                              setUserHistory(userHistory => [...userHistory, {
                                  question: currentQuestion,
                                  responses: userSelection
                              }])
                              if (exp) {
                                  var splitedExp = exp.split(':')
                                  evaluateExpression(splitedExp[1], userHistory)
                                      .then((val) => {
                                          if (val) {
                                              setNextQuestionRef(splitedExp[0])
                                          } else {
                                              setNextQuestionRef(userSelection[userSelection.length - 1].response.next_q_ref);
                                          }
                                      })
                              } else {
                                  setNextQuestionRef(userSelection[userSelection.length - 1].response.next_q_ref);
                              }

                              setUserSelection([])
                          }

                      }}
    >
        <Text>Valider</Text>
    </TouchableOpacity>

        {/*<View style={{ backgroundColor: 'green' }}>*/}
        {/*    {userHistory.map((element, index) => {*/}
        {/*        return <Text key={index}>{element.question.ref}</Text>*/}
        {/*    })}*/}
        {/*</View>*/}

        {/*<Text style={styles.questionText}>{currentQuestion ? currentQuestion.question : ""}</Text>*/}
        {/*<View style={styles.responseContainer}>*/}
        {/*    <FlatList*/}
        {/*        data={currentResponses}*/}
        {/*        renderItem={(item) => <ResponseButton element={item.item} key={item.index} history={userHistory}*/}
        {/*            onPress={(value) => {*/}
        {/*                if (value.status) {*/}
        {/*                    setUserSelection(userSelection => [...userSelection, value])*/}
        {/*                } else {*/}

        {/*                    var newSelection = userSelection.filter(function (obj) {*/}
        {/*                        return obj.response.id !== value.response.id;*/}
        {/*                    });*/}
        {/*                    setUserSelection(newSelection)*/}

        {/*                }*/}
        {/*            }}*/}
        {/*        />}*/}
        {/*    />*/}
    </SafeAreaView>)
}

const styles = StyleSheet.create({
    listContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    rectangleButton: {
        backgroundColor: '#F4F4F4',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginVertical: 5,
        minHeight: 100,
        width: '47%',
        justifyContent:'center',
    },
    quizContainer:{
        backgroundColor: 'green',
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
        backgroundColor: 'red',
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
})