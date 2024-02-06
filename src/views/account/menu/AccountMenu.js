import React, {useState} from "react";
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
    ActivityIndicator
} from "react-native"


import { logout } from '../../../actions/auth';
import { useDispatch } from "react-redux";
import { useQuery } from "react-query";

import { getCustomerPortal } from "../../../services/SubscriptionService";
import { useOrthoMasterRoles } from "../../../hooks/useOrthoMasterRoles";

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
                <ActivityIndicator color={"#fff"}/>
            }
        </TouchableOpacity>
    )
}

export const AccountMenu = ({ navigation, user }) => {
    const dispatch = useDispatch()
    const [gettingCustomerPortal, setGettingCustomerPortal] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)
    const roles = useOrthoMasterRoles()
    const customerPortal = useQuery(["GET", "Customer portal"], ()=>getCustomerPortal(user.office_id),
    {
        onSettled: () => setGettingCustomerPortal(false),
        onSuccess: (url) => {
            Linking.openURL(url)
        },
        onError: (err) => {
            setErrorMessage(err.response?.data?.message)
            setTimeout(()=>{
                setErrorMessage(null)
            }, 5000)
        },
        enabled: false
    })

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
                {
                    roles.isPrimaryManager &&
                    <CustomMenuButton
                        icon={require('../../../../assets/settings/icon-espace-client.png')}
                        text={'Mon espace client'}
                        loading={gettingCustomerPortal}
                        onPress={()=>{
                            customerPortal.refetch()
                            setGettingCustomerPortal(true)
                        }}
                    />
                }
                {
                    roles.isSeller &&
                    <CustomMenuButton
                        icon={require('../../../../assets/settings/professional.png')}
                        text={"Formulaire d'inscription"}
                        onPress={() => {
                            navigation.navigate('account-register-form', {
                                seller: user
                            })
                        }}
                    />
                }

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