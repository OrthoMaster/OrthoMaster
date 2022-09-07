import React from 'react'
import {
    TouchableOpacity
} from 'react-native'


export const QUIZ_STATUS = {
    pending: 0,
    success: 1,
    failure: 2
}

export const QuizBlock = () => {
    return <TouchableOpacity
    style={{
        height: '100%',
        width: '100%',
        position: 'absolute'
    }} />

}