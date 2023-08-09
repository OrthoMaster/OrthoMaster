import React, { useEffect } from 'react';
import {
    View,
    Image,
    Text,
    StyleSheet,
    SafeAreaView,
    Alert,
    Linking,
    StatusBar, ImageBackground, TouchableOpacity, Dimensions
} from 'react-native';
import { HomeHeaderButton } from './components/HomeHeaderButton';

import { useQuery } from 'react-query';
import { getUserNextLesson } from '../../services/ContentService';
import { useDispatch, useSelector } from 'react-redux';
import { actionChangeAppMode } from '../../actions/appModeAction';
import { MODES, selectModeValue } from '../../reducers/appModeReducer';
import { useTheme } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

export const HomeHeader = ({ navigation, userName }) => {
    const nextLesson = useQuery(['Home', 'GET', 'userNextLesson'], getUserNextLesson, {
        refetchOnWindowFocus: false,
        enabled: false
    })
    const { colors, isLabo, logos } = useTheme()
    const dispatch = useDispatch()
    const currentMode = useSelector(selectModeValue)

    useEffect(() => {
        if (!nextLesson.isLoading && !nextLesson.error && nextLesson.data) {

            navigation.navigate('Formation', {
                screen: 'formation-content',
                initial: false,
                params: { content: nextLesson.data }
            });
        }
    }, [nextLesson])


    let username = userName
    return (
        <LinearGradient
            colors={['#fff', colors.primary]}
            start={{ x: -2, y: -2 }}
            end={{ x: 1, y: 0 }}
            locations={[0, 0.9]}
            style={styles.container}
        >
            <SafeAreaView style={[styles.containerHeader, styles.AndroidSafeArea]}>
                <Image
                    style={[styles.logo, { opacity: isLabo ? 0 : 1 }]}
                    source={require('../../../assets/home/header/logo.png')}
                />
                <View style={styles.headerButtonGroup}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => {
                            navigation.navigate('home-search')
                        }}
                    >
                        <Image
                            source={require('../../../assets/navigation/search.png')}
                        />
                    </TouchableOpacity>
                </View>



            </SafeAreaView>
            <ImageBackground source={require('../../../assets/home/header/background.png')} resizeMode='stretch' style={{
                justifyContent: "center",
                alignItems: 'center',
            }}>
                {
                    !isLabo ?
                        <View style={{
                            height: Dimensions.get('screen').width * 0.3,
                            justifyContent: 'center'
                        }}>
                            <Text
                                style={{
                                    color: 'white',
                                    fontSize: 16,
                                    fontWeight: '400'
                                }}
                            >
                                Bonjour
                            </Text>
                            <Text
                                style={{
                                    color: 'white',
                                    fontSize: 22,
                                    fontWeight: '600',
                                }}
                            >
                                {username}
                            </Text>
                        </View>
                        : <Image
                            source={logos.full}
                            style={{
                                width: Dimensions.get('screen').width * 0.3,
                                height: Dimensions.get('screen').width * 0.3,
                                resizeMode: 'contain',
                            }}
                        />
                }
                <View
                    style={{
                        flexDirection: 'row',
                        width: '100%',
                        justifyContent: 'center',
                        flex: 1,
                        display: 'flex',
                        marginVertical: 20
                    }}>
                    <HomeHeaderButton
                        value='Poser une question'
                        color='#386CDA'
                        icon={require('../../../assets/home/header/header_button_question.png')}
                        style={styles.secondaryButton}
                        onPress={() => {
                            Linking.openURL('mailto:question@orthomaster.fr')
                        }}
                    />
                    <HomeHeaderButton
                        value='Mon labo'
                        color='#A84206'
                        style={styles.primaryButton}
                        icon={require('../../../assets/logo.png')}
                        onPress={() => {
                            if (currentMode == MODES.orthomaster) {
                                dispatch(actionChangeAppMode('thuasne'))
                            } else {
                                dispatch(actionChangeAppMode(MODES.orthomaster))
                            }
                        }}
                    />
                    <HomeHeaderButton
                        value='Rechercher un contenu'
                        color='#386CDA'
                        icon={require('../../../assets/home/header/header_button_search.png')}
                        style={styles.secondaryButton}
                        onPress={() => navigation.navigate('home-search')}
                    />
                </View>


            </ImageBackground>
        </LinearGradient>

    )
}

var styles = StyleSheet.create({
    container: {
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },

    secondaryButton: {
        marginTop: 20
    },
    primaryButton: {
        marginHorizontal: 15
    },
    containerHeader: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        resizeMode: 'contain',
        height: 50,
        flex: 2,
        alignSelf: 'center',
    },
    headerButtonGroup: {
        flex: 1,
        alignItems: 'flex-end'
    },
    headerButton: {
        resizeMode: 'contain',
        marginHorizontal: 15,
    },
    AndroidSafeArea: {
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
    },
})