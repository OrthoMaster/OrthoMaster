import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    FlatList,
    View,
    TouchableOpacity,
    SafeAreaView,
    Image
} from 'react-native';
import Svg, {
    Path
} from 'react-native-svg';
import { useQuery } from 'react-query';
import { fetchLessonByModuleWithProgression } from '../../services/ContentService';

import { getS3Image } from '../../services/S3Service';
import { LessonButton } from './components/LessonButton';
import { LoadingView } from '../LoadingView';
import { logout } from '../../actions/auth';
import { useDispatch } from 'react-redux';

export function LessonsView({ route, navigation }) {
    let moduleInfos = route.params.module
    const dispatch = useDispatch()
    const modules = useQuery('lessonProgress', () => fetchLessonByModuleWithProgression(moduleInfos.module.module_num), {
        onError: (error) => {
            if (error.response.data == 'token_not_valid') {
              dispatch(logout())
            }
          }
    })
    const [moduleLogo, setModuleLogo] = useState(null)


    const getModuleLogo = async () => {
        let path = 'lesson/' + moduleInfos.module.module_num + '/logo.png'
        try {
            const imageUrl = await getS3Image(path)
            return (imageUrl)
        } catch (error) {
            console.error('ImageFactory: ' + error);
        }
    }


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



    if (modules.isLoading) return <LoadingView />
    if (modules.error) return <Text>Error</Text>

    return <View style={styles.container}>
        <SafeAreaView style={[styles.headerContainer, { backgroundColor: moduleInfos.module.theme_color }]}>
            <TouchableOpacity
                style={styles.headerBackButton}
                onPress={() => navigation.goBack()}
            >
                <Svg
                    height={25} width={15}
                    viewBox={`0 0 30 40`}
                    style={{marginLeft: 30}}
                >
                    <Path d='M20 5 L5 20 L20 35' stroke='white' strokeWidth={5} strokeLinejoin='round' strokeLinecap='round' />
                </Svg>
            </TouchableOpacity>
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
            <Text style={styles.headerModule}>Module {moduleInfos.module.module_num}</Text>
            <Text style={styles.headerTitle}>{moduleInfos.module.title}</Text>

            <View style={styles.progressContanier}>
                <Text style={styles.progressIcons}>📚</Text>
                <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { backgroundColor: moduleInfos.module.theme_color, width: (moduleInfos.lesson_succeed * 100 / moduleInfos.total_lesson).toString() + "%" }]} />
                </View>
                <Text style={styles.progressIcons}>👨‍🎓</Text>
            </View>

            <FlatList
                data={modules.data}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={<View style={{height: 100}}/>}
                renderItem={(item) => <LessonButton
                    item={item}
                    onPress={() => {
                        if (item.item.content.published == true) {
                            navigation.navigate('formation-content', {
                                content: item.item.content
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