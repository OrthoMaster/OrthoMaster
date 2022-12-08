import React, { useState, useEffect } from 'react'
import {
    StyleSheet,
    View,
    TouchableOpacity,
    Text,
    Animated,
    Image
} from 'react-native'

import { useSelector } from 'react-redux'
import { selectContent } from '../../../../../reducers/contentReducer'

import { getS3Image } from '../../../../../services/S3Service'

const QuizCheckBoxButton = ({
    config,
    quizDone,
    onPress,
    quizAnswer
}) => {
    const content = useSelector(selectContent)
    const [clicked, setclicked] = useState(false);
    const [answerImage, setAnswerImage] = useState(null);
    const [animation, setAnimation] = useState(new Animated.Value(0));
    const handleAnimation = () => {
        Animated.timing(animation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false
        }).start()
    };
    const boxInterpolation = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [
            "#ED7D32",
            quizAnswer.find(elem => elem.value == config.attributes.ref) ?
                '#92D051'
                :
                '#ff0000'
        ]
    });
    const fetchAnswerImage = async () => {
        try {
            let path = content.type + '/' + content.module_num + '/' + content.title + '/' + config.children[0].attributes.src
            if (content.type != 'lesson') {
                path = content.type + '/' + content.title + '/' + config.children[0].attributes.src
            }
            return await getS3Image(path)
        } catch (error) {
            throw error
        }
    }

    useEffect(() => {
        if (quizDone) {
            handleAnimation()
        }

    }, [quizDone])



    useEffect(() => {
        var isMounted = true
        if (config.children.length > 0) {
            fetchAnswerImage().then((url) => {
                if (isMounted) {
                    setAnswerImage(url)
                }
            })
        }
        return () => {
            isMounted = false
        }
    }, [])


    return (
        <TouchableOpacity
            style={[
                styles.button,
                {
                    backgroundColor: clicked ? '#ED7D32' : '#ffffff',
                    borderColor: clicked ? '#ffffff' : '#ED7D32'
                }]}
            onPress={() => {
                if (!quizDone) {
                    setclicked(!clicked)
                    onPress(config.attributes.ref)
                }
            }}
        >
            <Animated.View style={{
                width: '100%',
                backgroundColor: quizDone && clicked ? boxInterpolation : null,
                paddingVertical: 5,
                paddingHorizontal: 10
            }}>
                {
                    answerImage != null ?
                        <Image
                            source={{
                                uri: answerImage
                            }}
                            style={{
                                width: parseInt(config.children[0].attributes.width),
                                height: parseInt(config.children[0].attributes.height),
                                alignSelf: 'center'
                            }}
                        />
                        :
                        <Text>{config.value}</Text>
                }
            </Animated.View>
        </TouchableOpacity>
    )
}


export const QuizCheckbox = ({
    quizPossibilities,
    quizAnswer,
    quizDone,
    onSelect,
}) => {
    const [userResponse, setuserResponse] = useState([])

    const handleUserResponse = (value) => {
        if (quizDone) {
            return
        }

        var newArray = userResponse

        if (newArray.includes(value)) {
            const index = newArray.indexOf(value)
            newArray.splice(index, 1)
        } else {
            newArray.push(value)
        }
        setuserResponse(newArray)
    }

    const submitAnswer = () => {
        let answer = userResponse.slice().sort().join(",");
        let correct = ''
        quizAnswer.forEach((element, index) => {
            if (index > 0) {
                correct += ','
            }
            correct += element.value
        });

        if (answer === correct) {
            onSelect(true)
        } else {
            onSelect(false)
        }
    }

    return (
        <View style={styles.container}>
            {
                quizPossibilities.map((element, index) => {
                    return <QuizCheckBoxButton
                        config={element}
                        key={index}
                        quizDone={quizDone}
                        quizAnswer={quizAnswer}
                        onPress={(value) => handleUserResponse(value)}
                    />
                })
            }
            <TouchableOpacity style={[
                styles.submitButton,
                {
                    backgroundColor: quizDone ? '#EDEDED' : '#D5D4D4',
                    borderWidth: 2,
                    borderColor: '#D5D4D4'
                }
            ]}
                onPress={() => submitAnswer()}
            >
                <Text style={[styles.submitButtonText]}>Valider</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingBottom: 10,
        alignItems: 'center'
    },
    button: {
        width: '90%',
        borderRadius: 5,
        alignItems: 'flex-start',
        justifyContent: 'center',
        borderWidth: 2,
        marginVertical: 5,
        backgroundColor: "#ffffff",

    },
    buttonSelected: {
        width: '90%',
        height: 40,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        marginVertical: 5,
        backgroundColor: '#FB782A'
    },
    textButton: {
        textAlign: 'center',

    },
    submitButton: {
        // borderColor: '#ED7D32',
        // borderWidth: 3,
        borderRadius: 50,
        backgroundColor: '#D5D4D4',
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        marginVertical: 20,
        width: '80%'
    },
    submitButtonText: {
        color: '#000000',
        fontSize: 18,
    }
})