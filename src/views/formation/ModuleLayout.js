import React, { useEffect, useState } from 'react'
import {
    Text,
    StyleSheet,
    FlatList,
    View,
    Image,
    TouchableOpacity,
    Modal
} from 'react-native'

import { LessonHeader } from './LessonHeader'
import { ModuleButton } from './components/ModuleButton';
import { LoadingView } from '../LoadingView'
import { MainQuizUnlockModal } from './modal/MainQuizUnlockModal';

import { useIsFocused } from '@react-navigation/native';
import { useQuery } from 'react-query';
import { fetchModulesWithUserProgression } from '../../services/ModuleService';
import { getFormationMainQuizStatus } from '../../services/FormationService';



const MainQuizButton = ({
    quizType,
    onClick,
    quizIsDone
}) => {


    return (
        <TouchableOpacity
            style={[styles.mainQuizButtonContainer, {
                //marginBottom: quizType == 'final' ? 100 : 40,
                backgroundColor: quizIsDone ? '#ffffff' : quizIsDone == 0 ? '#F76F10' : '#D2D2D2',

            }]}
            onPress={() => {
                if (quizIsDone == 0 || quizType == 'final') {
                    onClick()
                }
            }}
        >
            <Image
                source={quizType == 'initial' ?
                    quizIsDone ? require('../../../assets/formation/initial_quiz_done.png') : require('../../../assets/formation/initial_quiz.png')
                    : quizIsDone ? require('../../../assets/formation/final_quiz_done.png') : require('../../../assets/formation/final_quiz.png')
                }
                style={[styles.mainQuizButtonImg, {
                }]}
            />
            <Text style={[styles.mainQuizButtonText, {
                color: quizIsDone ? '#E75A08' : '#ffffff'
            }]}>
                {quizType == 'initial' ?
                    'Le Quiz de bienvenue'
                    : 'Le Quiz final'
                }
            </Text>
            <Image
                source={quizIsDone ?
                    require('../../../assets/formation/quiz_done.png')
                    : require('../../../assets/formation/quiz_play.png')}
                style={styles.mainQuizButtonImg}
            />
        </TouchableOpacity>
    )
}




export const ModuleLayout = ({ navigation, route }) => {
    const isFocused = useIsFocused();
    const [modalVisible, setModalVisible] = useState(true)
    const [formationPercentage, setFormationPercentage] = useState(0)
    const modules = useQuery('modulesProgress', () => fetchModulesWithUserProgression(), {
        onError: (error) => {
            throw error
        },
        onSuccess: (modules) => {
            let totalLesson = 0
            let finishLesson = 0
            modules.forEach(element => {
                totalLesson += element.total_lesson
                finishLesson += element.lesson_succeed
            });

            setFormationPercentage(finishLesson * 100 / totalLesson)
            setModalVisible(true)
        }
    })

    const formationMainQuiz = useQuery('getFormationMainQuiz', () => getFormationMainQuizStatus(1), {
        onError: (error) => {
            throw error
        }
    })

    //const mainQuiz

    useEffect(() => {
        if (isFocused) {
            formationMainQuiz.refetch()
            if (modules.data) {
                modules.refetch()
            }
        }
    }, [isFocused])


    if (modules.isLoading || formationMainQuiz.isLoading) return <LoadingView />
    if (modules.error || formationMainQuiz.error) return <Text>Error</Text>


    return (
        <View style={styles.container}>
            <LessonHeader
                onSearch={() => (navigation.navigate('formation-search'))}
                title={"Se former"}
                navigation={navigation}
            />

            <FlatList
                data={modules.data}
                renderItem={(item) => <ModuleButton
                    item={item}
                    onPress={(item) => navigation.navigate('formation-lessons', {
                        module: item
                    })}
                />}
                style={styles.listContainer}
                keyExtractor={(item, index) => index}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <MainQuizButton
                        quizType={'initial'}
                        quizIsDone={formationMainQuiz.data.quiz_initial_status}
                        onClick={() => {
                            navigation.navigate('formation-content', {
                                content: {
                                    type: 'lesson',
                                    title: 'initial'
                                }
                            })
                        }}
                    />
                }
                ListFooterComponent={
                    <MainQuizButton
                        quizType={'final'}
                        quizIsDone={formationMainQuiz.data.quiz_final_status}
                        onClick={() => {
                            navigation.navigate('formation-content', {
                                content: {
                                    type: 'lesson',
                                    title: 'final'
                                }
                            })
                        }}
                    />
                }
            />
            {
                formationMainQuiz.data.quiz_initial_status == null ?
                    <MainQuizUnlockModal
                        visible={modalVisible}
                        onExit={()=>{
                            setModalVisible(false)
                            formationMainQuiz.refetch()
                        }}
                        quizType='initial'
                        onQuiz={()=>{
                            setModalVisible(false)
                            navigation.navigate('formation-content', {
                                content: {
                                    type: 'lesson',
                                    title: 'initial'
                                }
                            })
                        }}
                    />
                    : null
            }
            {
                formationPercentage > 80 && formationMainQuiz.data.quiz_final_status == null ?
                <MainQuizUnlockModal
                        visible={modalVisible}
                        onExit={()=>{
                            setModalVisible(false)
                            formationMainQuiz.refetch()
                        }}
                        quizType='final'
                        onQuiz={()=>{
                            setModalVisible(false)
                            navigation.navigate('formation-content', {
                                content: {
                                    type: 'lesson',
                                    title: 'final'
                                }
                            })
                        }}
                    />
                    : null
            }
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        flex: 1,
        width: '100%',
    },
    listContainer: {
        width: '80%',
        alignSelf: 'center',
    },
    mainQuizButtonContainer: {
        alignSelf: 'center',
        width: '95%',
        height: 60,
        margin: 100,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        borderWidth: 0.5,
        borderColor: '#E75A08'
    },
    mainQuizButtonImg: {
        resizeMode: 'contain',
        height: '70%',
        width: '10%',
    },
    mainQuizButtonText: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#ffffff'
    },
})