import React, { } from "react";
import {
    View,
    TouchableOpacity,
    Image,
    Dimensions,
    StyleSheet,
    Alert,
    Text,
    Linking,
    ScrollView
} from "react-native"

import { useStore } from "react-redux";

import { logout } from '../../../actions/auth';
import { useDispatch } from "react-redux";


const CustomMenuButton = ({ icon, text, onPress, style }) => {
    return (
        <TouchableOpacity
            style={[buttonStyles.container, style]}
            onPress={() => onPress()}
        >
            <Image
                style={buttonStyles.icon}
                source={icon}
            />
            <Text style={buttonStyles.text}>{text}</Text>
        </TouchableOpacity>
    )
}

export const AccountMenu = ({ navigation }) => {
    const store = useStore()
    const dispatch = useDispatch()

    //const stateAuth = store.getState().auth


    return (
        <View style={styles.container}>

            <ScrollView>
                <View style={styles.shadow} />
                <CustomMenuButton
                    icon={require('../../../../assets/settings/profile.png')}
                    text={'Mon profil'}
                    onPress={() => {
                        console.log('pressed');
                        navigation.navigate('account-profile')
                    }}
                />
                {/* <CustomMenuButton
                    icon={require('../../../../assets/settings/formation.png')}
                    text={'Ma formation'}
                /> */}
                {/* <CustomMenuButton
                    icon={require('../../../../assets/settings/activity.png')}
                    text={'Mon activité'}
                /> */}
                {/* <CustomMenuButton
                    icon={require('../../../../assets/settings/professional.png')}
                    text={'Le réseau OrthoMaster'}
                /> */}

                <CustomMenuButton
                    icon={require('../../../../assets/settings/legal-paper.png')}
                    text={'Politique de confidentialité'}
                    onPress={() => (Linking.openURL('https://www.orthomaster.fr/_files/ugd/94d0f8_cca6c36de16f4489a4e85e2c03a7da9f.pdf'))}
                />

                <CustomMenuButton
                    icon={require('../../../../assets/settings/contact.png')}
                    text={'Nous contacter'}
                    onPress={() => (Linking.openURL('mailto:question@orthomaster.fr'))}
                />

                <CustomMenuButton
                    icon={require('../../../../assets/settings/logout.png')}
                    text={'Déconnexion'}

                    onPress={() => {
                        Alert.alert(
                            "Déconnexion",
                            "Veuillez confirmer",
                            [
                                {
                                    text: "Annuler",
                                    style: "cancel"
                                },
                                {
                                    text: "Se déconnecter", onPress: async () => {
                                        navigation.navigate('home-home')
                                        dispatch(logout())
                                    }
                                }
                            ]
                        );
                    }}
                />
                <View style={{ height: 200 }} />
            </ScrollView>

        </View>
    )
}



const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F76F10',
        width: '80%',
        height: Dimensions.get('screen').height,
        position: 'absolute',
        alignSelf: 'flex-end',
        shadowOpacity: 0.5,
        shadowRadius: 10,
        shadowOffset: {
            width: -5,
            height: 20
        },
    },
})

const buttonStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingVertical: 15,
        paddingLeft: 20,
        alignItems: 'center',
    },
    icon: {
        width: 20,
        height: 20,
    },
    text: {
        paddingHorizontal: 10,
        color: '#ffffff'
    }
})