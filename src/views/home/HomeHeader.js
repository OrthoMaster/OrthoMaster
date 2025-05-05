import React, { useEffect } from 'react';
import {
    View,
    Image,
    Text,
    StyleSheet,
    SafeAreaView,
    Alert,
    Linking,
    StatusBar, ImageBackground, TouchableOpacity, Dimensions,
    Platform
} from 'react-native';
import { HomeHeaderButton } from './components/HomeHeaderButton';

import { useQuery } from "react-query";
import { getUserNextLesson } from '../../services/ContentService';
import { useTheme } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import { getCurrentUser } from '../../services/UserService';


export const HomeHeader = ({ navigation, userName }) => {
    const nextLesson = useQuery(['Home', 'GET', 'userNextLesson'], ()=>getUserNextLesson(), {
        refetchOnWindowFocus: false,
        enabled: false
    })
    const { colors, isLabo, logos } = useTheme()
    const user = useQuery("current-user", ()=>getCurrentUser())

    useEffect(() => {
        if (!nextLesson.isLoading && !nextLesson.error && nextLesson.data) {

            navigation.navigate('Formation', {
                screen: 'formation-content',
                initial: false,
                params: { content: nextLesson.data }
            });
        }
    }, [nextLesson])


    let username = user.data?.name
    
    return (
        <View>

            <SafeAreaView style={[styles.containerHeader, styles.AndroidSafeArea]}>
                <Image
                    style={[styles.logo, { opacity: isLabo ? 0 : 1 }]}
                    source={require('../../../assets/logo-text-orange.png')}
                />
                <View style={styles.headerButtonGroup}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => {
                            navigation.navigate('home-search')
                        }}
                    >
                        <FontAwesome name="search" size={24} color="gray" />
                    </TouchableOpacity>
                </View>



            </SafeAreaView>

            {
                !isLabo ?
                    <View style={{
                        height: Dimensions.get('screen').width * 0.3,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <Text
                            style={{
                                color: 'gray',
                                fontSize: 16,
                                fontWeight: '400'
                            }}
                        >
                            Bonjour
                        </Text>
                        <Text
                            style={{
                                color: 'gray',
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
                    color='#F98407'
                    icon={require('../../../assets/navigation/question-icon.png')}
                    style={styles.secondaryButton}
                    onPress={() => {
                        Linking.openURL('mailto:question@orthomaster.fr')
                    }}
                />
                <HomeHeaderButton
                    value='Outils'
                    color='#1662A8'
                    style={styles.primaryButton}
                    icon={require('../../../assets/navigation/outils-icon.png')}
                    onPress={() => {
                        navigation.navigate('Outils')
                    }}
                />
                <HomeHeaderButton
                    value='Recherche          de contenu'
                    color='#71A11E'
                    icon={require('../../../assets/navigation/rechercher-icon.png')}
                    style={styles.secondaryButton}
                    onPress={() => navigation.navigate('home-search')}
                />
            </View>


        </View>


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