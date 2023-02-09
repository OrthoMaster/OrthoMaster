import React, { useState, useEffect } from 'react'
import {
    StyleSheet,
    View,
    TouchableOpacity,
    Text
} from 'react-native'

import InputSpinner from "react-native-input-spinner";


export const QuizNumber = ({ quizPossibilities, quizDone, quizAnswer, onSelect }) => {
    const [minVal, setminVal] = useState(parseInt(quizPossibilities[0].attributes.min))
    const [maxVal, setmaxVal] = useState(parseInt(quizPossibilities[0].attributes.max))
    const [jump, setJump] = useState(1)
    const [number, setNumber] = useState(parseInt(quizPossibilities[0].attributes.min))

    useEffect(() => {
        if (parseInt(quizPossibilities[0].attributes.step)) {
            setJump(parseInt(quizPossibilities[0].attributes.step))
        }
    }, [])

    console.log(quizPossibilities[0].attributes);

    const handleUserAnswer = () => {

        if (number == quizAnswer) {
            onSelect(true)
        } else {
            onSelect(false)
        }
    }

    return (
        <View>
            <InputSpinner
                style={styles.container}
                min={minVal}
                max={maxVal}
                step={jump}
                colorMax={"#D5D4D4"}
                colorMin={"#D5D4D4"}
                value={number}
                skin='clean'
                onChange={(num) => {
                    if (!quizDone)
                        setNumber(num)
                }}
            />
            <TouchableOpacity style={styles.submitButton}
                onPress={() => handleUserAnswer()}
            >
                <Text style={styles.submitButtonText}>Valider</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 20,
        width: '60%'
        //backgroundColor: '#fffefd'
    },
    submitButton: {
        borderRadius: 50,
        backgroundColor: '#D5D4D4',
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        marginBottom: 20,
    },
    submitButtonText: {
        color: '#000000',
        fontSize: 18,
    }
})