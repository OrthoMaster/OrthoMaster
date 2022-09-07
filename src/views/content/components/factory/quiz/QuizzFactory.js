import React, { useState, useEffect } from 'react'
import { Text, StyleSheet, Animated, View } from 'react-native'

import { QuizRadio } from './QuizRadio';
import { QuizNumber } from './QuizNumber';
import { QuizCheckbox } from './QuizCheckbox';
import { QuizMatch } from './QuizMatch';

import QuizResultModal from './QuizResultModal';

import { useDispatch, useStore } from "react-redux";

import { quizCompleted, finishContent } from '../../../../../actions/contentAction';


function getQuiz(content) {
    var quiz = {
        quizType: '',
        title: '',
        instruction: '',
        possibilities: [],
        answer: [],
        success: '',
        failure: ''
    }
    if (content.attributes['quiz-type']) {
        quiz.quizType = content.attributes['quiz-type']
    }

    content.children.forEach(element => {
        switch (element.name) {
            case 'question':
                quiz.title = element.value
                break;
            case 'instruction':
                quiz.instruction = element.value
                break;
            case 'elem':
                quiz.possibilities.push(element)
                break;
            case 'answer':
                if (element.children.length > 0) {
                    quiz.answer = element.children
                } else {
                    quiz.answer = element.value
                }
                break;
            case 'success':
                quiz.success = element.value
                break;
            case 'wrong':
                quiz.failure = element.value
                break;
            default:
                break;
        }
    });
    return quiz
}

function QuizAnswers({
    quizType,
    quizPossibilities,
    quizAnswer,
    quizDone,
    onCompleted,
    quizStatus
}) {

    const [userAnswer, setuserAnswer] = useState(null)


    useEffect(() => {
        if (userAnswer != null) {
            onCompleted(userAnswer)
        }

    }, [userAnswer])

    switch (quizType) {
        case 'radio':
            return (
                <QuizRadio
                    quizPossibilities={quizPossibilities}
                    quizAnswer={quizAnswer}
                    quizDone={quizDone}
                    quizStatus={quizStatus}
                    onSelect={(userAnswer) => setuserAnswer(userAnswer)}
                />)
        case 'number':
            return (
                <QuizNumber
                    quizPossibilities={quizPossibilities}
                    quizAnswer={quizAnswer}
                    quizDone={quizDone}
                    quizStatus={quizStatus}
                    onSelect={(userAnswer) => setuserAnswer(userAnswer)}
                />
            )
        case 'checkbox':
            return (
                <QuizCheckbox
                    quizPossibilities={quizPossibilities}
                    quizAnswer={quizAnswer}
                    quizDone={quizDone}
                    quizStatus={quizStatus}
                    onSelect={(userAnswer) => setuserAnswer(userAnswer)}
                />
            )
        case 'line':
            return (<QuizMatch
                quizPossibilities={quizPossibilities}
                quizAnswer={quizAnswer}
                quizDone={quizDone}
                quizStatus={quizStatus}
                onSelect={(userAnswer) => setuserAnswer(userAnswer)}
            />)
        default:
            return (<Text>(NO QUIZ)</Text>);
    }
}



export const QuizFactory = ({ content }) => {
    const [quiz] = useState(() => getQuiz(content))
    const [quizDone, setQuizIsDone] = useState(null)
    const [quizStatus, setQuizStatus] = useState(false)
    const [animation, setAnimation] = useState(new Animated.Value(0))
    const dispatch = useDispatch()
    const store = useStore();

    const checkIfLastQuiz = () => {
        const contentInfos = store.getState().content;
        if (contentInfos.quizPassed.length == contentInfos.nbQuiz) {
            return true
        }
        return false
    }


    const handleAnimation = (status) => {
        Animated.timing(animation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false
        }).start(() => {
            const isLast = checkIfLastQuiz()
            if (((isLast && quiz.success == '' && status) || (isLast && quiz.failure == '' && !status))) {
                dispatch(finishContent())
            }
        })
    }

    const boxInterpolation = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [
            "#EDEDED",
            quizStatus ? '#E7EDE0' : '#EDD0D0'
        ]
    })

    const quizInsruction = () => {
        if (quiz.instruction != '') {
            return quiz.instruction
        } else {
            switch (quiz.quizType) {
                case 'radio':
                    return 'Selectionne LA bonne réponse'
                case 'checkbox':
                    return 'Selectionne LA ou LES bonnes réponse(s)'
                case 'number':
                    return 'Choisis le bon nombre'
                case 'line':
                    return "Associe les paires ci-dessous en cliquant sur les propositions de droite jusqu'à trouver la bonne couleur"
                    //return "Clique sur chaque proposition à droite pour qu'elles correspondent avec les couleurs de gauche"
                default:
                    return '';
            }
        }
    }

    useEffect(() => {
        if (quizDone) {

        }
    }, [quizDone])


    return (<Animated.View style={[styles.container, { backgroundColor: quizDone ? boxInterpolation : '#EDEDED' }]}>
        <View style={styles.questionBox}>
            <Text style={[styles.questionText, { fontWeight: 'bold' }]}>
                {quiz.title}
            </Text>
        </View>

        <Text style={styles.instruction}>
            {quizInsruction()}
        </Text>
        <QuizAnswers
            quizType={quiz.quizType}
            quizPossibilities={quiz.possibilities}
            quizAnswer={quiz.answer}
            quizDone={quizDone}
            quizStatus={quizStatus}
            onCompleted={(status) => {
                handleAnimation(status)
                setQuizIsDone(true)
                setQuizStatus(status ? true : false)
                dispatch(quizCompleted({
                    status: status,
                }))


            }}
        />
        {(quizDone && quiz.success != '' && quizStatus) || (quizDone && quiz.failure != '' && !quizStatus) ?
            <QuizResultModal
                value={quizStatus ? quiz.success : quiz.failure}
                onExit={() => {
                    const isLast = checkIfLastQuiz()
                    if (isLast) {
                        dispatch(finishContent())
                    }
                }}
            />
            : null
        }

    </Animated.View>
    )
}



const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
        marginVertical: 20
    },
    questionBox: {
        width: '100%',
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        paddingHorizontal: 10,
        paddingVertical: 15,
    },
    questionText: {
        color: '#1B1C1E',
        textAlign: 'left',
        fontSize: 18,
        alignSelf: 'center',
        width: '90%',
    },
    instruction: {
        paddingHorizontal: 10,
        textAlign: 'center',
        paddingVertical: 5,
        fontSize: 12
    }
})