import React, { useEffect } from 'react';
import {
    View,
    Image,
    Text,
    StyleSheet,
    Linking,
    TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeHeaderButton } from './components/HomeHeaderButton';

import { useQuery } from "@tanstack/react-query";
import { getUserNextLesson } from '../../services/ContentService';
import { useTheme } from '@react-navigation/native';
import { useGetUser } from '../../hooks/useGetUser.hook';

import Feather from '@expo/vector-icons/Feather';
import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';


export const HomeHeader = ({ navigation, userName }) => {
    const nextLesson = useQuery({
        queryKey: ['Home', 'GET', 'userNextLesson'],
        queryFn: () => getUserNextLesson(),
        refetchOnWindowFocus: false,
        enabled: false
    })
    const { colors, isLabo, logos } = useTheme()
    const user = useGetUser()

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
        <SafeAreaView>
            <View style={styles.containerHeader}>
                <Image
                    style={styles.logo}
                    source={require('../../../assets/logo-text-orange.png')}
                />
                <View style={styles.headerButtonGroup}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => {
                            navigation.navigate('home-search')
                        }}
                    >
                        <Feather name="search" size={24} color={Colors.gray} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: Colors.gray, fontSize: 16, fontWeight: '400' }}>
                    Bonjour
                </Text>
                <Text style={{ color: Colors.primary, fontSize: 22, fontWeight: '600' }}>
                    {username}
                </Text>
            </View>

            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    flex: 1,
                    display: 'flex',
                    marginTop: Spacings.xl
                }}>
                <HomeHeaderButton
                    value='Poser une question'
                    color='#ff9500'
                    icon={require('../../../assets/navigation/question-icon.png')}
                    style={styles.secondaryButton}
                    onPress={() => {
                        Linking.openURL('mailto:question@orthomaster.fr')
                    }}
                />
                <HomeHeaderButton
                    value='Outils'
                    color='#0070c0'
                    style={styles.primaryButton}
                    icon={require('../../../assets/navigation/outils-icon.png')}
                    onPress={() => {
                        navigation.navigate('Outils')
                    }}
                />
                <HomeHeaderButton
                    value='Rechercher          de contenu'
                    color='#85b238'
                    icon={require('../../../assets/navigation/rechercher-icon.png')}
                    style={styles.secondaryButton}
                    onPress={() => navigation.navigate('home-search')}
                />
            </View>
        </SafeAreaView>
    )
}

var styles = StyleSheet.create({
    secondaryButton: {
        marginTop: Spacings.md
    },
    primaryButton: {
        marginHorizontal: Spacings.md
    },
    containerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: Spacings.lg,
        marginBottom: Spacings.xl
    },
    logo: {
        resizeMode: 'contain',
        height: 50,
        flex: 1,
    },
    headerButtonGroup: {
        flex: 1,
        alignItems: 'flex-end'
    },
    headerButton: {
        resizeMode: 'contain',
    }
})