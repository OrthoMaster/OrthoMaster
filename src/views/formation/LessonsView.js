import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    FlatList,
    View,
    TouchableOpacity,
    SafeAreaView,
    Image,
    RefreshControl
} from 'react-native';
import Svg, {
    Path
} from 'react-native-svg';
import { useQuery } from 'react-query';
import { fetchLessonByModuleWithProgression } from '../../services/ContentService';

import { getS3Image } from '../../services/S3Service';
import { LessonButton } from './components/LessonButton';
import { LoadingContent } from '../../component/LoadingContent';
import { FontAwesome5 } from '@expo/vector-icons';

export function LessonsView({ route, navigation }) {
    let { module, demoMode, formation } = route.params
    const lessons = useQuery(['Formation', 'GET', 'lessonProgress', module.module.module_num], () => fetchLessonByModuleWithProgression(module.module.module_num))
    const [refreshing, setRefreshing] = useState(false)
    const [moduleLogo, setModuleLogo] = useState(null)


    const getModuleLogo = async () => {
        let path = 'lesson/' + module.module.module_num + '/logo.png'
        try {
            const imageUrl = await getS3Image(path)
            return (imageUrl)
        } catch (error) {
            throw error
        }
    }

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        lessons.refetch()
        getModuleLogo().then((value) => {
            setModuleLogo(value)
        })
        setTimeout(() => {
            setRefreshing(false);
        }, 2000);
    }, []);


    useEffect(() => {
        var isDisplayed = true

        getModuleLogo().then((value) => {
            if (isDisplayed) {
                setModuleLogo(value)
            }
        })
        return (() => {
            isDisplayed = false
        })
    }, [])





    return <View style={styles.container}>
        <SafeAreaView style={[styles.headerContainer, { backgroundColor: module.module.theme_color }]}>
            <TouchableOpacity
                style={{
                    alignSelf: 'flex-start',
                    padding: 10,
                    top: 20
                }}
                onPress={() => navigation.goBack()}
            >
                <FontAwesome5 name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            {
                demoMode &&
                <Text style={{ alignSelf: 'flex-end', right: 20 }}>Démo</Text>
            }
        </SafeAreaView>


        <View style={styles.headerBox}>
            <Image
                source={{ uri: moduleLogo }}
                style={{
                    marginVertical: 5,
                    width: 100,
                    height: 100,
                    resizeMode: 'contain'
                }}
            />
            <Text style={styles.headerModule}>Module {module.module.module_num}</Text>
            <Text style={styles.headerTitle}>{module.module.title}</Text>

            <View style={styles.progressContanier}>
                <Text style={styles.progressIcons}>📚</Text>
                <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { backgroundColor: module.module.theme_color, width: (module.lesson_succeed * 100 / module.total_lesson).toString() + "%" }]} />
                </View>
                <Text style={styles.progressIcons}>👨‍🎓</Text>
            </View>

            <FlatList
                data={lessons.data}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={<View style={{ height: 100 }} />}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                renderItem={(item) => <LessonButton
                    lesson={item.item}
                    isBlocked={demoMode && item.item.demo_access == false}
                    onPress={(lesson) => {
                        if (lesson.content.published == true) {
                            navigation.navigate('formation-content', {
                                content: lesson.content,
                                formation: formation,
                                type: "lesson"
                            })
                        }
                    }}
                />
                }
                keyExtractor={(item, index) => index}
                style={styles.lessonList}
            />
        </View>


    </View>
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        flex: 1,
        alignItems: 'center'
    },
    headerContainer: {
        height: '20%',
        width: '100%',
    },

    headerBackButton: {
        width: 100,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerBox: {
        alignItems: 'center',
        top: -50,
        width: '90%',
        height: '100%',
    },
    headerModule: {
        fontWeight: '400',
        fontSize: 16,
        color: '#838393',
        marginVertical: 5
    },
    headerTitle: {
        fontWeight: '600',
        fontSize: 22
    },
    headerDescription: {
        fontWeight: '400'
    },

    progressContanier: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center'
    },
    progressIcons: {
        fontSize: 30
    },
    progressBarContainer: {
        backgroundColor: '#BCBCBC',
        flex: 1,
        height: '30%',
        borderRadius: 20
    },
    progressBar: {
        flex: 1,
        borderRadius: 20
    },
    lessonList: {
        width: '100%',
        flex: 1,
    },

    invertedRadiusHeader: {
        backgroundColor: '#fffefd',
        width: 800,
        height: 800,
        borderRadius: 500,
        transform: [
            { scaleX: 2 }
        ],
        position: 'absolute',
        top: '18%'
    }
});