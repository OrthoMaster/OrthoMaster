import React, { useEffect, useState, useCallback } from 'react'
import {
    Text,
    StyleSheet,
    FlatList,
    View,
    Image,
    TouchableOpacity,
    RefreshControl
} from 'react-native'

import { LessonHeader } from './LessonHeader'
import ModuleButton from './components/ModuleButton';
import { MainQuizUnlockModal } from './modal/MainQuizUnlockModal';

import { useIsFocused } from '@react-navigation/native';
import { isError, useQuery } from 'react-query';
import { fetchModulesWithUserProgression } from '../../services/ModuleService';
import { getFormationMainQuizStatus } from '../../services/FormationService';
import { LoadingContent } from '../../component/LoadingContent';



const MainQuizButton = ({
    quizType,
    onClick,
    quizData
}) => {
    const [quizIsDone, setquizIsDone] = useState(false)

    useEffect(() => {
        if (quizData) {
            if (quizData.quiz_initial_status && quizType == 'initial') {
                setquizIsDone(quizData.quiz_initial_status)
            }
            if (quizData.quiz_final_status && quizType == 'final') {
                setquizIsDone(quizData.quiz_final_status)
            }
        }
    }, [quizData])

    return (
        <TouchableOpacity
            style={[styles.mainQuizButtonContainer, {
                //marginBottom: quizType == 'final' ? 100 : 40,
                backgroundColor: quizIsDone ? '#ffffff' : quizIsDone == 0 ? '#ffaf31' : '#D2D2D2',

            }]}
            onPress={() => {
                if (quizIsDone == 0 || (quizIsDone == 1 && quizType == 'final')) {
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
                    tintColor: quizIsDone ? '#ffaf31' : "#fff"
                }]}
            />
            <Text style={[styles.mainQuizButtonText, {
                color: quizIsDone ? '#ffaf31' : '#ffffff'
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
    const [refreshing, setRefreshing] = useState(false)
    const isFocused = useIsFocused();
    const [modalVisible, setModalVisible] = useState(true)
    const [formationPercentage, setFormationPercentage] = useState(0)
    const modules = useQuery(['Formation', 'GET', 'modulesProgress'], () => fetchModulesWithUserProgression(), {
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

    const formationMainQuiz = useQuery(['getFormationMainQuiz'], () => getFormationMainQuizStatus(1))





    const onRefresh = useCallback(() => {
        setRefreshing(true);
        modules.refetch()
        formationMainQuiz.refetch()
        setTimeout(() => {
            setRefreshing(false);
        }, 2000);
    }, []);



    useEffect(() => {
        if (isFocused) {
            onRefresh()
        }
    }, [isFocused])


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
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListHeaderComponent={
                    <MainQuizButton
                        quizType={'initial'}
                        quizData={formationMainQuiz.data}
                        onClick={() => {
                            navigation.navigate('formation-content', {
                                content: {
                                    type: 'lesson',
                                    title: 'initial',
                                    s3_path: 'lesson'
                                }
                            })
                        }}
                    />
                }
                ListFooterComponent={
                    <MainQuizButton
                        quizType={'final'}
                        quizData={formationMainQuiz.data}
                        onClick={() => {
                            navigation.navigate('formation-content', {
                                content: {
                                    type: 'lesson',
                                    title: 'final',
                                    s3_path: 'lesson'
                                }
                            })
                        }}
                    />
                }
            />

            {
                formationMainQuiz.data && formationMainQuiz.data.quiz_initial_status == null ?
                    <MainQuizUnlockModal
                        visible={modalVisible}
                        onExit={() => {
                            setModalVisible(false)
                            formationMainQuiz.refetch()
                        }}
                        quizType='initial'
                        onQuiz={() => {
                            setModalVisible(false)
                            navigation.navigate('formation-content', {
                                content: {
                                    type: 'lesson',
                                    title: 'initial',
                                    s3_path: 'lesson'
                                }
                            })
                        }}
                    />
                    : null
            }
            {
                formationPercentage > 60 && formationMainQuiz.data && formationMainQuiz.data.quiz_final_status == null ?
                    <MainQuizUnlockModal
                        visible={modalVisible}
                        onExit={() => {
                            setModalVisible(false)
                            formationMainQuiz.refetch()
                        }}
                        quizType='final'
                        onQuiz={() => {
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
        borderColor: '#ffaf31'
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