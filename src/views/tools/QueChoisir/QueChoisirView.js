import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ScrollView,
    SafeAreaView,
    Image, ActivityIndicator, Dimensions,
} from "react-native"
import React, { useEffect, useRef, useState } from "react"
import { useQuery } from "react-query"
import {getAPIqueChoisirRedFlags, getAPIqueChoisirStep} from "../../../services/tools/QueChoisirService";
import BottomArrow from '../../../../assets/queChoisir/bottom_arrow.svg'
import UpperArrow from '../../../../assets/queChoisir/upper_arrow.svg'
import { LinearGradient } from "expo-linear-gradient";
import { getS3Image } from "../../../services/S3Service";
import { ResponseButton } from "./ResponseButton";
import { HelpSection } from "./HelpQC";
import { NavbarQC } from "./NavbarQC";
import { evaluateExpression } from "./tools";

export const QueChoisirView = ({ navigation, route }) => {
    const [questionIndex, setQuestionIndex] = useState(0)
    const [globalSteps, setGlobalSteps] = useState(null)
    const [userHistory, setUserHistory] = useState([])
    const [userSelection, setUserSelection] = useState([])
    const [helpIsActive, setHelpIsActive] = useState(false)
    const [currentResponse, setCurrentResponse] = useState(null)
    const [contraindicationArray, setContraindicationArray] = useState([])
    const [currentContraindicationArray, setCurrentContraindicationArray] = useState(new Set())
    const [isQueryEnabled, setIsQueryEnabled] = useState(false);

    const { width } = Dimensions.get('window');
    const helpWidth = width * 0.7;

    useEffect(() => {
        const updateArray = [];
        contraindicationArray.map((element) => {
            if (element.display_if) {
                evaluateExpression(element.display_if, userHistory)
                    .then((val) => {
                        if (val) {
                            updateArray.push(element);
                        }
                    })
            }
        })
        setCurrentContraindicationArray(updateArray);
    }, [userHistory])

    const getStep = useQuery(['Tools', 'GET', 'queChoisirStep', "Ceinture lombaire"], () => getAPIqueChoisirStep('Ceinture lombaire'), {
        onSuccess: (data) => {
            setGlobalSteps(data);
            setIsQueryEnabled(true);
        }
    })
    const getCurrentImage = useQuery(['Tools', 'GET', 'currentImage', "Ceinture lombaire", questionIndex], () => getS3Image(globalSteps[questionIndex].question.image_path), {
        enabled: isQueryEnabled
    })

    const getContraindication = useQuery(['Tools', 'GET', 'currentImage', "Ceinture lombaire"], () => getAPIqueChoisirRedFlags('Ceinture lombaire'), {
        onSuccess: (data) => {
            setContraindicationArray(data);
        }
    })

    if (globalSteps === null) return;
    return (<SafeAreaView style={styles.safeAreaContainer}>
        <View style={styles.container}>
            <View style={styles.rightView}>
                {getCurrentImage != null ?
                    <Image
                        source={{ uri: getCurrentImage?.data }}
                        style={styles.image}
                    /> : <ActivityIndicator />}
                <Text style={styles.heading}>{globalSteps[questionIndex].question.question}</Text>
                <ScrollView centerContent={true} style={styles.quizScroll} contentContainerStyle={{ alignItems: 'center' }}>
                    <View style={[styles.quizContainer]}>
                        {globalSteps[questionIndex].responses?.map((response, index) => {
                            return <ResponseButton element={response} key={globalSteps[questionIndex].question.ref + response.value} history={userHistory}
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
                                onHelp={() => {
                                    setHelpIsActive(!helpIsActive);
                                    setCurrentResponse(response);
                                }
                                }
                            />
                        })}
                    </View>
                    {[...currentContraindicationArray].map((element, index) => {
                        return <View style={styles.tipsBox} key={index}>
                            <Image source={require('../../../../assets/queChoisir/shield.png')} style={{marginLeft: '5%'}} />
                            <ScrollView contentContainerStyle={styles.textContainer} showsVerticalScrollIndicator={false}>
                                <Text style={styles.text}>
                                    {element.text}
                                </Text>
                            </ScrollView>
                        </View>
                        })}
                </ScrollView>
                <View style={styles.arrowContainer}>
                    <LinearGradient
                        colors={['#E8764A', '#EC4C70']}
                        style={styles.arrow}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <TouchableOpacity style={styles.arrow}
                            onPress={() => {
                                if (userHistory.length > 0) {
                                    setQuestionIndex(userHistory[userHistory.length - 1].question.ref.charCodeAt(0) - 65);
                                    setUserHistory(userHistory.slice(0, userHistory.length - 1));
                                }
                            }}
                        >
                            <UpperArrow style={{ marginTop: 10 }} height={40} width={40} />
                        </TouchableOpacity>
                    </LinearGradient>
                    <LinearGradient
                        colors={['#E8764A', '#EC4C70']}
                        style={styles.arrow}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <TouchableOpacity style={[styles.arrow, { height: '100%', width: '100%' }]}
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
                            <BottomArrow style={{ marginTop: 10 }} height={40} width={40} />
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            </View>
            {helpIsActive ? <HelpSection helpIsActive={helpIsActive}
                onPress={() => {
                    setHelpIsActive(false);
                }
                } helpWidth={helpWidth} response={currentResponse} /> : null}
            <NavbarQC global={globalSteps} questionIndex={questionIndex} onPress={(index) => {
                    setUserHistory(userHistory.slice(0, index))
                setQuestionIndex(index);
            }}/>

        </View>

    </SafeAreaView>)
}

const styles = StyleSheet.create({
    rightView: {
        flex: 1,
        width: '80%',
        alignSelf: 'flex-end',
    },
    tipsBox: {
        flexDirection: 'row',
        backgroundColor: '#E6FFFE',
        marginVertical: 15,
        width: '80%',
        borderRadius: 16,
        borderWidth: 1,
        borderColor:'#4E9694',
        alignItems: 'center',
    },
    textContainer: {
        flexGrow: 1,
        justifyContent: 'center'
    },
    text: {
        marginHorizontal: '5%',
        paddingVertical: '10%',
        flexGrow: 1,
        color: '#4E9694',
        fontWeight: 500,
    },
    safeAreaContainer: {
        flex: 1,
    },
    arrowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
    },
    quizContainer: {
        width: '100%',
        flexWrap: 'wrap',
        flexDirection: 'row',
        justifyContent: 'space-evenly',
    },
    quizScroll: {
        paddingVertical: 10,
        width: "100%",
    },
    container: {
        flex: 1,
        width: '100%',
        backgroundColor: '#ffffff'
    },
    image: {
        width: "90%",
        marginBottom: 20,
        borderRadius: 16,
        resizeMode: "cover",
        height: "35%",
        alignSelf: 'center',
    },
    heading: {
        fontSize: 24,
        fontWeight: 'bold',
        alignSelf: 'center',
    },
    arrow: {
        marginBottom: 15,
        borderRadius: 50,
        height: 60,
        width: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
})