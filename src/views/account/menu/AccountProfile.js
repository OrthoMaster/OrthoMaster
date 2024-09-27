import React, { useState } from "react";
import {
    SafeAreaView,
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    Dimensions,
    ScrollView,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard,
    Platform,
    Linking
} from "react-native";

import { useStore } from "react-redux";
import { useMutation } from "react-query";
import { changeUserPassword } from "../../../services/UserService";

import { Modal } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useGetUser } from "../../../hooks/useGetUser.hook";

const DisplayUserInfo = ({ dataType, data }) => {


    if (dataType == 'Type de compte') {
        switch (data) {
            case 0:
                data = 'Administrateur'
                break;
            case 1:
                data = 'Titulaire'
                break;
            case 2:
                data = 'Associé'
                break;
            default:
                data = 'inconnue'
                break;
        }
    }

    if (dataType == 'Téléphone') {
        if (data == '')
            data = 'inconnue'
    }

    return (
        <View style={{ paddingVertical: 10 }}>
            <Text style={{ fontSize: 10, color: '#ffaf31', fontWeight: 'bold' }}>{dataType}</Text>
            <Text style={{ fontSize: 15 }}>{data}</Text>
        </View>
    )
}


export const AccountProfile = ({navigation}) => {
    const {data: user, ...userQuery} = useGetUser()

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
            <ScrollView >
                <View style={styles.container}>
                    <View style={styles.user}>
                        <Image
                            style={{
                                height: Dimensions.get('screen').width / 4,
                                width: Dimensions.get('screen').width / 4,
                                resizeMode: 'contain'
                            }}
                            source={require('../../../../assets/settings/profile/user.png')}
                        />
                        <Text style={styles.nameText}>{user.name + ' ' + user.lastname}</Text>
                    </View>
                    <View style={styles.personalInfoContainer}>
                        <Text style={styles.primaryText}>Informations personnelles</Text>
                        {/* <DisplayUserInfo
                            dataType={"Nom d'utilisateur"}
                            data={user.username}
                        /> */}
                        <DisplayUserInfo
                            dataType={"Fonction professionelle"}
                            data={user.job_function}
                        />
                        <DisplayUserInfo
                            dataType={"E-mail"}
                            data={user.email}
                        />
                        <DisplayUserInfo
                            dataType={"Téléphone"}
                            data={user.tel}
                        />

                        <TouchableOpacity style={{
                            alignSelf: 'center',
                            paddingVertical: 10
                        }}
                            onPress={() => {
                                Linking.openURL("https://espace.orthomaster.fr/web/reset_password")
                            }}
                        >
                            <Text style={{
                                color: '#ffaf31'
                            }}>Changer de mot de passe</Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </ScrollView>

        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#ffffff",
        height: "100%"
    },
    user: {
        flexDirection: 'row',
        width: '90%',
        alignSelf: 'center',
        alignItems: 'center',
        paddingVertical: 10

    },
    nameText: {
        fontSize: 25,
        fontWeight: 'bold',
        paddingHorizontal: 20,
    },
    primaryText: {
        fontWeight: 'bold',
        fontSize: 18
    },
    secondaryText: {

    },
    personalInfoContainer: {
        width: '100%',
        alignSelf: 'center',
        padding: 20
    },

    resetContainer: {
        height: '100%',
        justifyContent: 'flex-end'
    },
    resetView: {
        backgroundColor: '#ffffff',
        height: '100%',
        borderTopLeftRadius: 10,
        width: '100%',
        alignItems: 'center'
    },
    resetViewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    resetReturnButton: {
        width: 25,
        height: 25,
        position: 'absolute',
        alignSelf: 'flex-start',
        margin: 15
    },
    inputFields: {
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: '#f3f3f3',
        height: 50,
        width: '80%',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        marginVertical: 5
    },
    submitBtn: {
        backgroundColor: '#ffaf31',
        paddingVertical: 10,
        paddingHorizontal: 50,
        margin: 30
    },
    submitBtnTxt: {
        color: '#ffffff'
    }
})