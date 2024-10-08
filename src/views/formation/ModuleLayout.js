import React, { useEffect, useState, useCallback } from 'react'
import {
    Text,
    StyleSheet,
    FlatList,
    View,
    Image,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator
} from 'react-native'

import { LessonHeader } from './LessonHeader'
import ModuleButton from './components/ModuleButton';
import { MainQuizUnlockModal } from './modal/MainQuizUnlockModal';

import { useQuery } from 'react-query';
import { fetchModules } from '../../services/ModuleService';
import { getUserRegisteredFormation } from '../../services/FormationService';

import { AntDesign } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';

const MainQuizButton = ({
    quizType,
    onClick,
    isDone,
    enabled
}) => {

    return (
        <TouchableOpacity
            style={[styles.mainQuizButtonContainer, {
                //marginBottom: quizType == 'final' ? 100 : 40,
                backgroundColor: enabled ? (isDone ? '#ffffff' : '#ffaf31') : "#D2D2D2"

            }]}
            onPress={() => {
                if (enabled) {
                    onClick()
                }
            }}
        >
            <Image
                source={quizType == 'initial' ?
                    isDone ? require('../../../assets/formation/initial_quiz_done.png') : require('../../../assets/formation/initial_quiz.png')
                    : isDone ? require('../../../assets/formation/final_quiz_done.png') : require('../../../assets/formation/final_quiz.png')
                }
                style={[styles.mainQuizButtonImg, {
                    tintColor: isDone ? '#ffaf31' : "#fff"
                }]}
            />
            <Text style={[styles.mainQuizButtonText, {
                color: isDone ? '#ffaf31' : '#ffffff'
            }]}>
                {quizType == 'initial' ?
                    'Le Quiz de bienvenue'
                    : 'Le Quiz final'
                }
            </Text>
            {
                enabled ?
                    <Image
                        source={isDone ?
                            require('../../../assets/formation/quiz_done.png')
                            : require('../../../assets/formation/quiz_play.png')}
                        style={styles.mainQuizButtonImg}
                    />
                    : <AntDesign name="lock" size={30} color="white" />
            }
            {
                (quizType == "final" && isDone) &&
                <Ionicons style={{
                    position: 'absolute',
                    right: -10, bottom: -10,
                    backgroundColor: '#fff'
                }} name="reload" size={24} color="#ffaf31" />
            }
        </TouchableOpacity>
    )
}




export const ModuleLayout = ({ navigation, route }) => {
    const { userFormationId, demoMode } = route.params
    const [refreshing, setRefreshing] = useState(false)
    const [modalVisible, setModalVisible] = useState(true)
    const {
        data: formationData,
        refetch: formationRefetch
    } = useQuery(["user-formations", userFormationId], () => getUserRegisteredFormation({ idUserFormation: userFormationId }))
    const formation = Array.isArray(formationData) ? formationData[0] : null
    const {
        data: modules,
        isLoading: modulesLoading,
        refetch: modulesRefetch
    } = useQuery(['formation-modules', formation?.id_formation], () => fetchModules({
        idFormation: formation?.id_formation
    }), { enabled: !!formation })

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        modulesRefetch()
        formationRefetch()
        setTimeout(() => {
            setRefreshing(false);
        }, 2000);
    }, []);


    return (
        <View style={styles.container}>
            <LessonHeader
                onSearch={() => (navigation.navigate('formation-search'))}
                title={formation?.formation_name}
                navigation={navigation}
                returnEnabed={true}
                searchEnabled={false}
            />
            {
                modulesLoading && !modules ?
                    <ActivityIndicator />
                    :
                    <FlatList
                        data={modules}
                        renderItem={(item) => <ModuleButton
                            module={item.item}
                            index={item.index}
                            isBlocked={demoMode && item.item.demo_access == 0}
                            onPress={(module) => {
                                navigation.navigate('formation-lessons', {
                                    module: module,
                                    demoMode: demoMode,
                                    formation: formation
                                })
                            }}
                        />}
                        style={styles.listContainer}
                        keyExtractor={(item, index) => index}
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                        ListHeaderComponent={
                            (formation && formation.initial_quiz_path) &&
                            <MainQuizButton
                                quizType={'initial'}
                                onClick={() => {
                                    navigation.navigate('formation-content', {
                                        content: {
                                            type: 'lesson',
                                            title: 'initial',
                                            s3_path: formation.initial_quiz_path
                                        },
                                        formation: formation,
                                        type: "quiz"
                                    })
                                }}
                                enabled={demoMode ? false : formation?.initial_grade ? false : true}
                                isDone={formation?.initial_grade ? true : false}
                            />
                        }
                        ListFooterComponent={
                            (formation && formation.final_quiz_path) &&
                            <MainQuizButton
                                quizType={'final'}
                                onClick={() => {
                                    navigation.navigate('formation-content', {
                                        content: {
                                            type: 'lesson',
                                            title: 'final',
                                            s3_path: formation.final_quiz_path
                                        },
                                        formation: formation,
                                        type: "quiz"
                                    })
                                }}
                                enabled={demoMode ? false : formation?.progress_rate > 60 ? true : false}
                                isDone={formation?.final_grade ? true : false}
                            />
                        }
                    />
            }

            {
                !demoMode && formation && formation.initial_grade == null && formation.initial_quiz_path ?
                    <MainQuizUnlockModal
                        visible={modalVisible}
                        onExit={() => {
                            setModalVisible(false)
                        }}
                        quizType='initial'
                        onQuiz={() => {
                            setModalVisible(false)
                            navigation.navigate('formation-content', {
                                content: {
                                    type: 'lesson',
                                    title: 'initial',
                                    s3_path: 'lesson'
                                },
                                formation: formation,
                                type: "quiz"
                            })
                        }}
                    />
                    : null
            }
            {
                !demoMode && formation?.progress_rate > 60 && formation && formation.final_grade == null && formation.final_quiz_path ?
                    <MainQuizUnlockModal
                        visible={modalVisible}
                        onExit={() => {
                            setModalVisible(false)
                        }}
                        quizType='final'
                        onQuiz={() => {
                            setModalVisible(false)
                            navigation.navigate('formation-content', {
                                content: {
                                    type: 'lesson',
                                    title: 'final',
                                    s3_path: 'lesson'
                                },
                                formation: formation,
                                type: "quiz"
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
        backgroundColor: "#fff"
    },
    listContainer: {
        width: '80%',
        alignSelf: 'center',
        paddingVertical: 50
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