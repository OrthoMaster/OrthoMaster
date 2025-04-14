import React, { useEffect, useState } from "react"
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ScrollView,
    SafeAreaView,
    Image, Dimensions,
} from "react-native"
import { useQuery } from "react-query"
import { getAPIqueChoisirRedFlags, getAPIqueChoisirStep } from "../../../../../services/tools/QueChoisirService";
import BottomArrow from '../../../../../../assets/queChoisir/bottom_arrow.svg'
import UpperArrow from '../../../../../../assets/queChoisir/upper_arrow.svg'
import { LinearGradient } from "expo-linear-gradient";
import { getS3Image } from "../../../../../services/S3Service";
import { ResponseButton } from "./ResponseButton";
import { HelpSection } from "./HelpQC";
import { NavbarQC } from "./NavbarQC";
import { evaluateExpression } from "../tools";
import GotIt from "../../../../../../assets/queChoisir/check.svg";
import { getAPIgetProducts } from "../../../../../services/ProductsService";

export const QueChoisirView = ({ navigation, route }) => {
    const { category, filtersConfig } = route.params
    const [isFinished, setIsFinished] = useState(false)
    const [questionIndex, setQuestionIndex] = useState(0)
    const [globalSteps, setGlobalSteps] = useState(null)

    const [userHistory, setUserHistory] = useState([])
    const [helpIsActive, setHelpIsActive] = useState(false)
    const [responseHelp, setResponseHelp] = useState(null)
    const [contraindicationArray, setContraindicationArray] = useState([])
    const [currentContraindicationArray, setCurrentContraindicationArray] = useState([])
    const [toolIsLoaded, setToolIsLoaded] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null)

    const [stepImage, setStepImage] = useState(null)
    const [filtredProducts, setFiltredProducts] = useState([])

    const { width } = Dimensions.get('window');
    const helpWidth = width * 0.8;
    useQuery(['Tools', 'GET', 'queChoisirStep', category], () => getAPIqueChoisirStep(category), {
        onSuccess: (data) => {
            setGlobalSteps(data);
            setToolIsLoaded(true);
        }
    })
    useQuery(['Tools', 'GET', 'currentImage', category], () => getAPIqueChoisirRedFlags(category), {
        onSuccess: (data) => {
            setContraindicationArray(data);
        }
    })
    const products = useQuery(['Tools', 'GET', 'getProducts', category], () => getAPIgetProducts(category), {
        onSuccess: (data) => {
            setFiltredProducts(data)
        },
    })
    const getCurrentImage = useQuery(['Tools', 'GET', 'currentImage', category, questionIndex], () => getS3Image(globalSteps[questionIndex].question.image_path), {
        enabled: toolIsLoaded,
        onSuccess: (data) => {
            setStepImage(data)
        }
    })

    const filterProduct = () => {
        if (products.data && globalSteps) {
            let refToSearch = []
            userHistory.forEach(step => {
                step.responses.forEach(responseObj => {
                    refToSearch.push(step.question.ref + responseObj.response.value)
                });
            });
            let newSelection = []
            products.data.forEach(product => {
                if (refToSearch.every(item => product.qc_ref.includes(item))) { //TODO filter sans OK SI donc parsing de string car includes return booléen
                    
                    newSelection.push(product)
                }
            });
            setFiltredProducts(newSelection)
        }
    }

    const findContreIndications = () => {
        const updateArray = [];

        contraindicationArray.forEach((element) => {
            if (element.display_if) {
                evaluateExpression(element.display_if, userHistory)
                    .then((val) => {
                        if (val) {
                            updateArray.push(element);
                        }
                    })
            }
        })
        if (updateArray != currentContraindicationArray)
            setCurrentContraindicationArray(updateArray);
    }


    useEffect(() => {
        filterProduct()
        findContreIndications()

    }, [userHistory])

    useEffect(() => {
        if (isFinished) {
            navigation.navigate('tools-que-choisir-final', {
                content: {
                    userHistory,
                    filtredProducts,
                },
                filtersConfig,
                category
            });
        }
    }, [isFinished])



    useEffect(() => {
        setStepImage(null)
    }, [questionIndex])

    if (globalSteps === null) return;
    return (<SafeAreaView style={styles.safeAreaContainer}>
        <View style={styles.container}>
            <View style={styles.rightView}>
                <View style={styles.imageContainer}>
                    {
                        stepImage && getCurrentImage.data ?
                        <Image
                            source={{ uri: getCurrentImage.data }}
                            style={{
                                resizeMode: 'cover',
                                height: '100%'
                            }}
                        />
                        : <View style={{height: "100%", color: "#fff"}}/>

                    }
                </View>



                <Text style={styles.heading}>{globalSteps[questionIndex].question.question}</Text>

                {
                    errorMessage &&
                    <Text style={{alignSelf: 'center'}}>{errorMessage}</Text>
                }

                <ScrollView centerContent={true} style={styles.quizScroll} contentContainerStyle={{ alignItems: 'center', paddingBottom: 100 }}>

                    <View style={[styles.quizContainer]}>
                        {globalSteps[questionIndex].responses?.map((response, index) => {
                            return <ResponseButton element={response} key={globalSteps[questionIndex].question.ref + response.value} history={userHistory}
                                currentStepHistory={userHistory[questionIndex]?.responses}
                                onPress={(value) => {
                                    let copyUserHistory = [...userHistory]
                                    let currentQuestion = { ...copyUserHistory[questionIndex] }

                                    if (Object.keys(currentQuestion).length === 0) {
                                        currentQuestion.question = globalSteps[questionIndex].question
                                        currentQuestion.responses = []
                                    }

                                    if (value.status) {
                                        if (currentQuestion.question.mode === "unique") {
                                            currentQuestion.responses = [value]
                                        } else {
                                            currentQuestion.responses = [...currentQuestion.responses, value]
                                        }
                                    } else {
                                        if (globalSteps.length - 1 == questionIndex) {
                                            setIsFinished(false)
                                        }
                                        var newSelection = currentQuestion.responses.filter(function (obj) {
                                            return obj.response.id !== value.response.id;
                                        });
                                        currentQuestion.responses = newSelection
                                    }
                                    copyUserHistory[questionIndex] = currentQuestion
                                    setUserHistory(copyUserHistory)
                                }}

                                onHelp={() => {
                                    setHelpIsActive(!helpIsActive);
                                    setResponseHelp(response);
                                }
                                }
                            />
                        })}
                    </View>

                    {currentContraindicationArray.map((element, index) => {
                        return <View style={styles.tipsBox} key={index}>
                            <Image source={require('../../../../../../assets/queChoisir/shield.png')} style={{ marginLeft: '5%' }} />
                            <ScrollView contentContainerStyle={styles.textContainer} showsVerticalScrollIndicator={false}>
                                <Text style={styles.text}>
                                    {element.text}
                                </Text>
                            </ScrollView>
                        </View>
                    })}

                </ScrollView>

                <View style={styles.arrowContainer}>

                    {/* UPPER ARROW */}
                    <LinearGradient
                        colors={['#33C0B7', '#33C0B7']}
                        style={[styles.arrow, { width: 40, height: 40, marginHorizontal: 10 }]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}>
                        <TouchableOpacity style={[styles.arrow, { width: 40, height: 40 }]}
                            onPress={() => {
                                if (userHistory?.length > 0) {
                                    if (userHistory[questionIndex - 1]) {
                                        if (isFinished)
                                            setIsFinished(false)
                                        setQuestionIndex(userHistory[questionIndex - 1].question.ref.charCodeAt(0) - 65);
                                    }
                                    setUserHistory(userHistory.slice(0, questionIndex));
                                }
                            }}>
                            <UpperArrow style={{ marginTop: 10, }} height={'70%'} width={'70%'} />
                        </TouchableOpacity>
                    </LinearGradient>

                    {/* BOTTOM ARROW */}
                    <LinearGradient
                        colors={['#33C0B7', '#33C0B7']}
                        style={[styles.arrow, { marginHorizontal: 10 }]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}>
                        <TouchableOpacity style={[styles.arrow, { height: '100%', width: '100%' }]}
                            onPress={() => {

                                const mode = globalSteps[questionIndex].question.mode
                                const nbResponse = userHistory[questionIndex]?.responses?.length ? userHistory[questionIndex]?.responses?.length : 0
                                switch (mode) {
                                    case 'unique':
                                        if (nbResponse != 1) {
                                            setErrorMessage("Une réponse est attendue")
                                            return
                                        } else
                                            break
                                    case 'multiple':
                                        if (nbResponse < 1) {
                                            setErrorMessage("Au moins 1 réponse est attendue")
                                            return
                                        } else
                                            break
                                    default:
                                        break;
                                }

                                let exp = userHistory[questionIndex]?.responses[userHistory[questionIndex]?.responses?.length - 1]?.response.skip_to_if
                                let nextCustomIndex = userHistory[questionIndex]?.responses[userHistory[questionIndex]?.responses?.length - 1]?.response.next_q_ref
                                if (exp) {
                                    var splitedExp = exp.split(':')
                                    evaluateExpression(splitedExp[1], userHistory)
                                        .then((val) => {
                                            if (val) {
                                                setQuestionIndex(splitedExp[0].charCodeAt(0) - 65)
                                            } else {
                                                if (nextCustomIndex) {
                                                    setQuestionIndex(nextCustomIndex.charCodeAt(0) - 65);
                                                } else {
                                                    setQuestionIndex(questionIndex + 1)
                                                }
                                            }
                                        })
                                } else {
                                    setErrorMessage(null)
                                    if (nbResponse == 0 && !userHistory[questionIndex]) {
                                        let newHistory = userHistory
                                        newHistory.push({
                                            question: globalSteps[questionIndex].question,
                                            responses: []
                                        })
                                    }
                                    if (nextCustomIndex) {
                                        setQuestionIndex(nextCustomIndex.charCodeAt(0) - 65);
                                    } else {
                                        if (globalSteps.length - 1 == questionIndex) {
                                            setIsFinished(true)
                                        } else {
                                            setQuestionIndex(questionIndex + 1)
                                        }
                                    }
                                }
                            }}
                        >
                            {
                                questionIndex === globalSteps.length - 1 ? <GotIt style={{ marginTop: 20, marginRight: 10 }} height={40} width={40} stroke={'#FFFFFF'} /> :
                                    <BottomArrow style={{ marginTop: 10 }} height={'70%'} width={'70%'} />
                            }
                        </TouchableOpacity>
                    </LinearGradient>

                </View>
                <Text style={{ textAlign: 'center', paddingVertical: 5 }}>Nombre de produits trouvés : <Text style={{ fontWeight: 'bold', color: "#33C0B7" }}>{filtredProducts.length}</Text></Text>
            </View>


            {helpIsActive ? <HelpSection helpIsActive={helpIsActive}
                onPress={() => {
                    setHelpIsActive(false);
                }
                } helpWidth={helpWidth} response={responseHelp} /> : null}
            <NavbarQC global={globalSteps} questionIndex={questionIndex} />
            
        </View>

    </SafeAreaView >)
}

const styles = StyleSheet.create({
    rightView: {
        flex: 1,
        width: '88%',
        alignSelf: 'flex-end',
        backgroundColor: '#F1F1F1'
    },
    tipsBox: {
        flexDirection: 'row',
        backgroundColor: '#E6FFFE',
        marginVertical: 15,
        width: '80%',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#4E9694',
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
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        bottom: 15,
        alignSelf: 'center'
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
    },
    imageContainer: {
        width: "100%",
        marginBottom: 20,
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