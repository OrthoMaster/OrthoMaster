import React, { useState, useEffect } from 'react'
import {
    StyleSheet,
    View,
    TouchableOpacity,
    Text
} from 'react-native'

import NumericInput from 'react-native-numeric-input'


export const QuizNumber = ({ quizPossibilities, quizDone, quizAnswer, onSelect }) => {
    const [response, setResponse] = useState(0);
    const [minVal, setminVal] = useState(0)
    const [maxVal, setmaxVal] = useState(30)
    const [jump, setJump] = useState(1)

    useEffect(() => {
        const attributes = quizPossibilities[0].attributes

        if (attributes.min) {
            const val = parseInt(attributes.min)
            setminVal(val)
            setResponse(val)
        }
        if (attributes.max)
            setmaxVal(parseInt(attributes.max))
        if (attributes.jump) {
            setJump(parseInt(attributes.jump))
        }

    }, [])

    const handleUserAnswer = () => {

        if (response == quizAnswer) {
            onSelect(true)
        } else {
            onSelect(false)
        }
    }

    return (
        <View>
            <NumericInput
                containerStyle={styles.container}
                value={response}
                onChange={(value) => {
                    if (!quizDone)
                        setResponse(value)
                }}
                totalWidth={250}
                totalHeight={80}
                iconSize={25}
                step={jump}
                minValue={minVal}
                maxValue={maxVal}
                valueType='real'
                rounded
                editable={false}
                textColor='#000000'
                iconStyle={{ color: 'white' }}
                rightButtonBackgroundColor='#F7700D'
                leftButtonBackgroundColor='#F7700D'

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
        backgroundColor: '#fffefd'
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