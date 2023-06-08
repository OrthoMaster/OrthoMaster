import { StyleSheet, Text, TouchableOpacity, View, Animated, PanResponder, FlatList, ScrollView, SafeAreaView } from "react-native"
import React, { useEffect, useState, useCallback } from "react"
import { useQuery } from "react-query"
import { getAPIqueChoisirStep } from "../../../services/tools/QueChoisirService";


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
            style={[styles.responseBox, { backgroundColor: pressed ? 'green' : 'grey' }]}
            onPress={() => {
                onPress({
                    response: element,
                    status: !pressed
                })
                setPressed(!pressed)
            }}
        >
            <Text style={styles.responseText}>{element.response}</Text>
        </TouchableOpacity>
    )
}


export const QueChoisirView = ({ navigation, route }) => {
    const [nextQuestionId, setNextQuestionId] = useState()
    const [currentQuestion, setCurrentQuestion] = useState(null)
    const [currentResponses, setCurrentResponses] = useState(null)
    const [userHistory, setUserHistory] = useState([])

    const [userSelection, setUserSelection] = useState([])


    const getStep = useQuery(['Tools', 'GET', 'queChoisirStep', nextQuestionId], () => getAPIqueChoisirStep(nextQuestionId), {
        onSuccess: (data) => {
            setCurrentQuestion(data.question)
            setCurrentResponses(data.responses)
        }
    })



    return (<SafeAreaView style={styles.container}>
        <View style={{ backgroundColor: 'green' }}>
            {userHistory.map((element, index) => {
                return <Text key={index}>{element.question.ref}</Text>
            })}
        </View>

        <Text style={styles.questionText}>{currentQuestion ? currentQuestion.question : ""}</Text>
        <View style={styles.responseContainer}>
            <FlatList
                data={currentResponses}
                renderItem={(item) => <ResponseButton element={item.item} key={item.index} history={userHistory}
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
                />}
            />


            <TouchableOpacity style={{ backgroundColor: 'grey' }}
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
                                        setNextQuestionId(splitedExp[0])
                                    } else {
                                        setNextQuestionId(userSelection[userSelection.length - 1].response.next_q_id);
                                    }
                                })
                        } else {
                            setNextQuestionId(userSelection[userSelection.length - 1].response.next_q_id);
                        }

                        setUserSelection([])
                    }

                }}
            >
                <Text>Valider</Text>
            </TouchableOpacity>
        </View>
    </SafeAreaView>)
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        flex: 1
    },
    questionText: {
        fontSize: 25,
        fontWeight: 'bold',
        textAlign: 'center',
        height: '30%'
    },
    responseContainer: {
        backgroundColor: "red",
        flex: 1,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        alignItems: 'center',
        paddingVertical: 20

    },
    responseBox: {
        alignItems: 'center',
        paddingVertical: 10,
        backgroundColor: 'grey',
        marginVertical: 5,
        width: '80%'
    },
    responseText: {
    }
})