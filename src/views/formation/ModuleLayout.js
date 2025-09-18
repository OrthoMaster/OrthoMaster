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

import Animated, { useSharedValue } from 'react-native-reanimated';

import ModuleButton from './components/ModuleButton';
import { MainQuizUnlockModal } from './modal/MainQuizUnlockModal';

import { useQuery } from "@tanstack/react-query";
import { fetchModules } from '../../services/ModuleService';
import { getUserRegisteredFormation } from '../../services/FormationService';

import { AntDesign } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import CollapsibleHeaderLayout from '../../component/CollapsibleHeaderLayout';


const MainQuizButton = ({
    quizType,
    onClick,
    isDone,
    enabled,
    hint
}) => {
    return (
        <TouchableOpacity
            style={[styles.mainQuizButtonContainer, {
                //marginBottom: quizType == 'final' ? 100 : 40,
                // backgroundColor: enabled ? (isDone ? '#ffffff' : '#ffaf31') : "#D2D2D2"
                backgroundColor: isDone ? '#ffffff' : enabled ? '#ffaf31' : "#D2D2D2"

            }]}
            onPress={() => {
                if (enabled) {
                    onClick()
                }
            }}
        >
            <View style={{
                width: '100%', height: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-around',
            }}>

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
                    isDone ?
                        <Image
                            source={require('../../../assets/formation/quiz_done.png')}
                            style={styles.mainQuizButtonImg}
                        />
                        : enabled ?
                            <Image
                                source={require('../../../assets/formation/quiz_play.png')}
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
            </View>
            {
                (hint && !enabled) &&
                <Text style={{
                    color: "#000",
                    fontSize: 12,
                    position: 'absolute',
                    bottom: -20
                }}>{hint}</Text>
            }
        </TouchableOpacity>
    )
}


const ExpandedHeader = ({ formation }) => {
    const [formationDates, setFormationDates] = useState(null)

    useEffect(() => {
        if (formation && formation.start_date_theorical && formation.end_date_theorical) {
            const startDate = new Date(formation.start_date_theorical)
            const endDate = new Date(formation.end_date_theorical)


            setFormationDates({
                start: startDate.toLocaleDateString(),
                end: endDate.toLocaleDateString()
            })
        }
    }, [formation])


    return (
        <View style={{ gap: 10 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>{formation?.formation_name}</Text>
            <View style={styles.row}>
                <View style={{ gap: 4 }}>
                    <View style={{ display: 'flex', flexDirection: 'row', alignSelf: 'center' }}>
                        <Text>📚</Text>
                        <View style={{
                            backgroundColor: '#F1F1F1',
                            width: "90%",
                            height: 15,
                            borderRadius: 15
                        }}>
                            <View style={{
                                backgroundColor: formation?.progress_rate == 100 ? '#9FFF7A' : '#FFAF31',
                                height: '100%',
                                width: formation?.progress_rate + "%",
                                borderRadius: 15
                            }} />
                            <Text style={{
                                position: 'absolute',
                                alignSelf: 'center',
                                fontSize: 12
                            }}>{formation?.progress_rate} %</Text>
                        </View>
                        <Text>🏅</Text>
                    </View>
                    <Text style={{ color: '#fff' }}><Text style={{ fontWeight: 'bold' }}>⏱️ Temps passé : </Text>{formation?.time_spent}</Text>
                    {
                        formationDates && // Afficher si parcours DPC connus
                        <View style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-around'
                        }}>
                            <Text style={{
                                backgroundColor: '#4554D1',
                                color: "#fff",
                                alignSelf: "flex-start",
                                paddingVertical: 5,
                                paddingHorizontal: 10,
                                borderRadius: 50,
                                marginVertical: 5
                            }}>Parcour DPC</Text>
                            <Text style={{ color: '#fff' }}>
                                {
                                    (formationDates.start) &&
                                    <Text>
                                        <Text style={{ fontWeight: 'bold' }}>Du </Text>{formationDates.start}
                                    </Text>
                                }
                                {
                                    (formationDates.end) &&
                                    <Text>
                                        <Text style={{ fontWeight: 'bold' }}> au </Text>{formationDates.end}
                                    </Text>
                                }
                            </Text>
                        </View>
                    }
                </View>
            </View>
        </View>
    )
}

const DATA = Array.from({ length: 60 }, (_, i) => ({
    id: String(i + 1),
    label: `Élément ${i + 1}`,
}));

export const ModuleLayout = ({ navigation, route }) => {
    const { userFormationId, demoMode } = route.params
    const [refreshing, setRefreshing] = useState(false)
    const [modalVisible, setModalVisible] = useState(true)
    const {
        data: formationData,
        refetch: formationRefetch
    } = useQuery({
        queryKey: ["user-formations", userFormationId],
        queryFn: () => getUserRegisteredFormation({ idUserFormation: userFormationId })
    })
    const formation = Array.isArray(formationData) ? formationData[0] : null
    const {
        data: modules,
        isLoading: modulesLoading,
        refetch: modulesRefetch
    } = useQuery({
        queryKey: ['formation-modules', formation?.id_formation],
        queryFn: () => fetchModules({
            idFormation: formation?.id_formation
        }),
        enabled: !!formation
    })

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        modulesRefetch()
        formationRefetch()
        setTimeout(() => {
            setRefreshing(false);
        }, 2000);
    }, []);



    useEffect(() => {
        console.log(formation);


    }, [formation])


    return (
        <View style={styles.container}>
            <CollapsibleHeaderLayout
                maxHeaderHeight={180}
                minHeaderHeight={56}
                backButton={true}
                headerBackgroundColor="#8089D1"
                enableSnap
                renderExpanded={() => (
                    <ExpandedHeader formation={formation} />
                )}
                renderCollapsed={() => (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>{formation?.formation_name}</Text>
                    </View>
                )}
            >
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
                            scrollEnabled={false}
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
                                    hint={"Débloqué au delà de 60% de progression"}
                                />
                            }
                        />
                }
            </CollapsibleHeaderLayout>
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
            <TouchableOpacity style={{
                backgroundColor: '#8089D1',
                width: 50, height: 50,
                position: 'absolute',
                bottom: 20, left: 20,
                zIndex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 50,
                shadowOffset: {
                    width: 3, height: 3
                },
                shadowColor: 'gray',
                shadowOpacity: 0.8,
                shadowRadius: 5
            }}
                onPress={() => {
                    navigation.goBack()
                }}
            >
                <AntDesign name="left" size={24} color="#fff" />
            </TouchableOpacity>
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
        paddingVertical: 10
    },
    mainQuizButtonContainer: {
        alignSelf: 'center',
        width: '95%',
        height: 60,
        margin: 100,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
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