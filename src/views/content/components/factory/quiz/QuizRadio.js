import React, { useState, useEffect } from 'react'
import { Text, View, StyleSheet, TouchableOpacity, Animated } from 'react-native'
import { QuizBlock } from './quizUtils';

const QuizRadioButton = ({ config, quizDone, onPress, answer }) => {
    const [clicked, setclicked] = useState(false)
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
            answer == config.attributes.ref ?
                '#92D051'
                :
                '#ff0000'
        ]
    });

    useEffect(() => {
        if (quizDone) {
            handleAnimation()
            return
        }
        setclicked(false)
    }, [quizDone])


    return <TouchableOpacity
        style={[
            styles.buttonRadio,
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
        <Animated.View
            style={[styles.buttonRadio, {
                width: '100%',
                backgroundColor: quizDone && clicked ? boxInterpolation : null,
                borderColor: clicked ? '#ffffff' : '#ED7D32'
            }]}
        >
            <Text style={styles.textButton}>{config.value}</Text>
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
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
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
