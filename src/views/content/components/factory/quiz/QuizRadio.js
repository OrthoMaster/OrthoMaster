import React, { useState, useEffect } from 'react'
import { Text, View, StyleSheet, TouchableOpacity, Animated, ActivityIndicator, Image } from 'react-native'
import { useSelector } from 'react-redux';
import { selectContent } from '../../../../../reducers/contentReducer';

import { getS3Image } from '../../../../../services/S3Service';
import { logout } from '../../../../../actions/auth';

const QuizRadioButton = ({ config, quizDone, onPress, answer }) => {
    const [clicked, setclicked] = useState(false)
    const [animation, setAnimation] = useState(new Animated.Value(0));
    const [answerImage, setAnswerImage] = useState(null)
    const content = useSelector(selectContent)
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
            answer == config.attributes.ref ?
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
            return
        }
        setclicked(false)
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


    return <TouchableOpacity
        style={[
            styles.buttonRadio,
            {
                backgroundColor: clicked ? '#ED7D32' : '#ffffff',
                borderColor: clicked ? '#ffffff' : '#ED7D32',
                height: config.children.length > 0 ? 100 : 40
            }]}
        onPress={() => {
            if (!quizDone) {
                setclicked(!clicked)
                onPress(config.attributes.ref)
            }
        }}
    >
        <Animated.View
            style={[ styles.buttonRadio, {
                width: '100%', height: '100%',
                backgroundColor: quizDone && clicked ? boxInterpolation : null,
                borderColor: clicked ? '#ffffff' : '#ED7D32'
            }]}
        >
            {
                config.children.length > 0 ?
                    answerImage ?
                        <Image source={{ uri: answerImage }} style={{
                            resizeMode: 'contain',
                            height: '100%',
                            width: '100%',
                        }} />
                        : <ActivityIndicator />
                    : <Text style={styles.textButton}>{config.value}</Text>
            }
            
        </Animated.View>
    </TouchableOpacity>
}





export const QuizRadio = ({ quizPossibilities, quizDone, quizAnswer, onSelect }) => {
    const [userResponse, setUserResponse] = useState(null)


    const handleUserAnswer = () => {
        if (quizDone) {
            return
        }
        if (userResponse) {
            if (userResponse == quizAnswer) {
                onSelect(true)
            } else {
                onSelect(false)
            }
        }
    }

    return <View style={styles.container}>
        {quizPossibilities.map((elem, index) => {
            return (<QuizRadioButton
                key={index}
                quizDone={quizDone}
                answer={quizAnswer}
                config={elem}
                onPress={(value) => {
                    setUserResponse(value)
                }}
            />)
        })}
        <TouchableOpacity style={styles.submitButton}
            onPress={() => handleUserAnswer()}
        >
            <Text style={styles.submitButtonText}>Valider</Text>
        </TouchableOpacity>
    </View>
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center'
    },
    buttonRadio: {
        width: '90%',
        //height: 90,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        marginVertical: 5


    },
    textButton: {
        textAlign: 'center',
        //    backgroundColor: '#1B1C1E',

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
