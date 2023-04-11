import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    SafeAreaView,
    Image,
    ImageBackground,
    ActivityIndicator
} from "react-native"
import React, { useEffect, useState, useCallback } from "react"
import { useQuery } from "react-query"
import { getAPIqueChoisirRedFlags, getAPIqueChoisirStep } from "../../../services/tools/QueChoisirService";
import { TextGame } from "../../../component/TextGame";
import { getS3Image } from "../../../services/S3Service";


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

    const styleUnpressed = {
        backgroundColor: '#FFC49E',
        borderColor: '#F48225'
    }
    const stylePressed = {
        backgroundColor: '#FF8435',
        borderColor: '#F48225'
    }
    useEffect(() => {
        if (element.display_if) {
            evaluateExpression(element.display_if, history)
                .then((val) => {
                    //console.log('ELEM:',element);
                    //console.log('display ?:',val);
                    setIsDisplay(val)
                })

        }
    }, [])


    if (!isDisplay) return null
    return (
        <TouchableOpacity
            style={[styles.responseBox, pressed ? stylePressed : styleUnpressed]}
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
    const tool = 'Ceinture lombaire'
    const [nextQuestionRef, setNextQuestionRef] = useState('A')
    const [currentQuestion, setCurrentQuestion] = useState(null)
    const [currentResponses, setCurrentResponses] = useState(null)
    const [userHistory, setUserHistory] = useState([])
    const [userSelection, setUserSelection] = useState([])
    const [isLoading, setIsLoading] = useState(false)

    const imgUrl = useQuery(['getQCs3IMG', nextQuestionRef], () => getS3Image(currentQuestion.image_path), {
        enabled: currentQuestion != null,
        onSuccess: () => {
            setIsLoading(false)
        }
    })
    const redFlags = useQuery('getQueChoisirRedFlags', () => getAPIqueChoisirRedFlags(tool),
        {
            onError: (e) => { throw e }
        })

    const detectRedFlag = async (userHistory) => {
        var flagsToDisplay = []
        if (redFlags.data) {
            redFlags.data.forEach(element => {
                evaluateExpression(element.display_if, userHistory)
                    .then((val) => {
                        if (val) {
                            flagsToDisplay.push(element)
                        }
                        console.log(`${element.display_if} : ${val}`);
                    })
            });
        }
        return flagsToDisplay
    }

    useQuery(['getQueChoisirStep', nextQuestionRef], () => getAPIqueChoisirStep(nextQuestionRef, tool), {
        onError: (e) => {
            throw e
        },
        onSuccess: (data) => {
            setCurrentQuestion(data.question)
            setCurrentResponses(data.responses)
        },
        onSettled: () => {
            setIsLoading(true)
        }
    })


    useEffect(() => {
        detectRedFlag(userHistory)
            .then((val) => {
                console.log('Final:', val);
            })
    }, [userHistory])


    return (<SafeAreaView style={styles.container}>
        <SafeAreaView>
            <TouchableOpacity style={styles.closeButtonContainer}
                onPress={() => navigation.goBack()}>
                <Image source={require('../../../../assets/navigation/close_black.png')} style={styles.closeButtonImg} />
            </TouchableOpacity>

        </SafeAreaView>
        <View style={styles.historyContainer}>
            <Text style={{ textAlign: 'center', fontSize: 18 }}>Historique</Text>
        </View>

        <View style={styles.questionContainer}>
            {!isLoading ?
                <ImageBackground source={{ uri: imgUrl.data }} resizeMode="contain" style={styles.captainBackgroundContainer}>
                    <TextGame text={currentQuestion ? currentQuestion.question : ""} speaker={'Captaine ortho'} />
                </ImageBackground>
                : <ActivityIndicator style={{ alignSelf: 'center' }} />
            }
        </View>
        <View style={styles.bottomContainer}>

            <View style={styles.responseContainer}>
                {
                    currentResponses ?
                        currentResponses.map((item, index) => {
                            return <ResponseButton element={item} key={index} history={userHistory}
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
                        })
                        : null
                }
            </View>
        </View>
        <TouchableOpacity style={{ borderWidth: 3, borderColor: 'red', height: '10%', width: '100%', position: 'absolute', bottom: 0 }}
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
                    setCurrentQuestion(null)
                    setCurrentResponses(null)
                }

            }}
        >
            <Text>Glisser vers le haut pour valider la réponse</Text>
        </TouchableOpacity>

    </SafeAreaView>)
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#99DAFF'
    },
    closeButtonContainer: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
    },
    closeButtonImg: {
        width: '50%',
        height: '50%',
        resizeMode: 'contain',
    },
    historyContainer: {
        backgroundColor: 'green',
        width: '50%',
        alignSelf: 'center',
        alignItems: 'center',
        paddingVertical: 5
    },

    bottomContainer: {
        backgroundColor: '#FFA14D',
        flex: 1
    },
    questionContainer: {
        flex: 1,
        flexGrow: 1.2,
    },
    captainBackgroundContainer: {
        flex: 1,
        marginTop: 20,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 15
    },
    responseContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 10,
        alignContent: 'flex-end'
    },
    responseBox: {
        alignItems: 'center',
        paddingVertical: 30,
        paddingHorizontal: 30,
        margin: 2,
        //borderWidth: 2,
        flexGrow: 1
    },
    responseText: {
        fontSize: 15
    }
})