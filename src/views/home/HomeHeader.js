import React, { useEffect } from 'react';
import {
    View,
    Image,
    Text,
    StyleSheet,
    SafeAreaView,
    Alert,
    Linking,
    StatusBar, ImageBackground
} from 'react-native';
import { HomeHeaderButton } from './components/HomeHeaderButton';

import { useQuery } from 'react-query';
import { getUserNextLesson } from '../../services/ContentService';

export const HomeHeader = ({ navigation, userName }) => {
    const nextLesson = useQuery('getUserNextLesson', getUserNextLesson, {
        refetchOnWindowFocus: false,
        enabled: false,
        onError: (error) => {
            throw error
        }
    })


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
        <ImageBackground source={require('../../../assets/home/header/background.png')} resizeMode='stretch' style={{
            flex: 1,
            justifyContent: "center"
        }}>
            <SafeAreaView style={styles.container}>
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
                        marginBottom: 20
                    }}
                >
                    {username}
                </Text>
                <View
                    style={{
                        flexDirection: 'row',
                        paddingVertical: 35,
                        width: '100%',
                        justifyContent: 'center',
                        flex: 1,
                        display: 'flex'
                    }}>
                    <HomeHeaderButton
                        value='Poser une question'
                        color='#386CDA'
                        icon={require('../../../assets/home/header/header_button_question.png')}
                        style={styles.secondaryButton}
                        onPress={() => {
                            Linking.canOpenURL('mailto:question@orthomaster.fr')
                            .then((supported)=> {
                                if (supported) {
                                    Linking.openURL('mailto:question@orthomaster.fr')
                                } else {
                                    Alert.alert(`Impossible d'ouvrir: question@orthomaster.fr`);
                                }
                            })

                        }}
                    />
                    <HomeHeaderButton
                        value='Leçon suivante'
                        color='#A84206'
                        icon={require('../../../assets/home/header/header_button_flash.png')}
                        style={styles.primaryButton}
                        onPress={() => {
                            nextLesson.refetch()
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


            </SafeAreaView>
        </ImageBackground>

    )
}

var styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30
    },

    secondaryButton: {
        marginTop: 20
    },
    primaryButton: {
        marginHorizontal: 15
    }
})