import React, { useState } from "react";
import {
    View,
    TouchableOpacity,
    Image,
    Dimensions,
    StyleSheet,
    Alert,
    Text,
    Linking,
    ScrollView,
    ActivityIndicator,
} from "react-native"
import Ionicons from '@expo/vector-icons/Ionicons';

import { useLogout } from "../../../hooks/useLogout.hook";
import { orthomasterShare } from "../../../futils";

const CustomMenuButton = ({ icon, text, onPress, style, loading }) => {
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
            {
                loading &&
                <ActivityIndicator color={"#fff"} />
            }
        </TouchableOpacity>
    )
}

export const AccountMenu = ({ navigation, user }) => {
    const logout = useLogout()
    const [errorMessage, setErrorMessage] = useState(null)

    return (
        <View style={styles.container}>

            <ScrollView>
                <View style={styles.shadow} />
                <CustomMenuButton
                    icon={require('../../../../assets/settings/profile.png')}
                    text={'Mon profil'}
                    onPress={() => {
                        navigation.navigate('account-profile')
                    }}
                />
                <CustomMenuButton
                    icon={require('../../../../assets/settings/icon-espace-client.png')}
                    text={'Mon espace client'}
                    onPress={() => {
                        Linking.openURL("https://espace.orthomaster.fr/web/login")
                    }}
                />

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
                                        logout.mutate()
                                    }
                                }
                            ]
                        );
                    }}
                />
                <View style={{ height: 150 }} />
                {
                    errorMessage &&
                    <View style={{
                        width: "90%",
                        backgroundColor: '#fff',
                        padding: 10,
                        alignSelf: 'center',
                        borderRadius: 10,
                        alignItems: 'center'
                    }}>
                        <Text style={{
                            color: 'red'
                        }}>{errorMessage}</Text>
                    </View>
                }

                <View style={{
                    alignItems: 'center',
                    alignSelf: 'center',
                    backgroundColor: '#fff',
                    borderRadius: 10,
                    marginVertical: 50,
                    width: "60%",
                    padding: 5,
                    shadowOffset: {
                        width: 0, height: 0
                    },
                    shadowRadius: 10,
                    shadowOpacity: 0.2
                }}>
                    <TouchableOpacity
                        style={{
                            width: "90%",
                            alignItems: 'center',
                            backgroundColor: '#fff',
                            padding: 5,
                            borderRadius: 10
                        }}
                        onPress={() => {
                            orthomasterShare({
                                message: "Rejoignez le premier écosystème de l'orthopédie !\n" +
                                    user.name + " vous invite à découvrir la plateforme OrthoMaster.\n" +
                                    "Cliquez sur ce lien ci-dessus et découvrez des centaines de contenus réservés aux professionnels de santé.\n\nhttps://espace.orthomaster.fr/inscription",
                                url: "https://espace.orthomaster.fr/inscription"
                            })
                        }}
                    >
                        <Ionicons name="person-add-outline" size={20} color="#000" />
                        <Text style={{
                            color: '#000',
                            textAlign: 'center',
                            marginVertical: 5,
                            fontSize: 12
                        }}>
                            Inviter à rejoindre OrthoMaster
                        </Text>
                    </TouchableOpacity>

                </View>
            </ScrollView>

        </View>
    )
}



const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffaf31',
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
        tintColor: "#162754"
    },
    text: {
        paddingHorizontal: 10,
        color: '#162754'
    }
})