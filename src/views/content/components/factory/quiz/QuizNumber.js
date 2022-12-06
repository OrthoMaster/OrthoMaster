import React, { useState, useEffect } from 'react'
import {
    StyleSheet,
    View,
    TouchableOpacity,
    Text
} from 'react-native'

import InputSpinner from "react-native-input-spinner";


export const QuizNumber = ({ quizPossibilities, quizDone, quizAnswer, onSelect }) => {
    const [minVal, setminVal] = useState(0)
    const [maxVal, setmaxVal] = useState(30)
    const [jump, setJump] = useState(1)
    const [number, setNumber] = useState(1)

    useEffect(() => {
        const attributes = quizPossibilities[0].attributes

        if (attributes.min) {
            const val = parseInt(attributes.min)
            setminVal(val)
            setNumber(val)
        }
        if (attributes.max)
            setmaxVal(parseInt(attributes.max))
        if (attributes.step) {
            setJump(parseInt(attributes.step))
        }

    }, [])

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
                max={maxVal}
                min={minVal}
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