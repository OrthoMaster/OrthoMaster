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
    Keyboard
} from "react-native";

import { useStore } from "react-redux";
import { useMutation } from "react-query";
import { changeUserPassword } from "../../../services/UserService";

import { Modal } from "react-native";
import { Ionicons } from '@expo/vector-icons';

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
    const store = useStore()
    const userState = store.getState().auth.userCurrentSession
    const [changingPassword, setchangingPassword] = useState(false)

    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setconfirmPassword] = useState('')

    const [statusText, setStatusText] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const changePasswordMutation = useMutation('changePassword', changeUserPassword, {
        onSuccess: (msg) => {
            setStatusText(msg)
            Alert.alert(msg)
            navigation.goBack()

        },
        onError: err => {
            Alert.alert(err.response.data.message)
        }
    })

    const handleChange = () => {
        setStatusText('')
        if (newPassword != confirmPassword) {
            setStatusText("Les mots de passe ne correspondent pas.")
            return
        }

        changePasswordMutation.mutate({ oldPassword: oldPassword, newPassword: newPassword })


    }


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
                        <Text style={styles.nameText}>{userState.name + ' ' + userState.lastname}</Text>
                    </View>
                    <View style={styles.personalInfoContainer}>
                        <Text style={styles.primaryText}>Informations personnelles</Text>
                        <DisplayUserInfo
                            dataType={"Nom d'utilisateur"}
                            data={userState.username}
                        />
                        <DisplayUserInfo
                            dataType={"Fonction professionelle"}
                            data={userState.job_function}
                        />
                        <DisplayUserInfo
                            dataType={"E-mail"}
                            data={userState.email}
                        />
                        <DisplayUserInfo
                            dataType={"Téléphone"}
                            data={userState.tel}
                        />

                        <TouchableOpacity style={{
                            alignSelf: 'center',
                            paddingVertical: 10
                        }}
                            onPress={() => {
                                setchangingPassword(prevState => !prevState)
                            }}
                        >
                            <Text style={{
                                color: '#ffaf31'
                            }}>Changer de mot de passe</Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </ScrollView>

            <Modal
                animationType="slide"
                visible={changingPassword}
                transparent={true}
            >
                <SafeAreaView style={styles.resetContainer}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={[styles.container, { width: '100%' }]}
                    >
                        <TouchableWithoutFeedback
                            style={{ width: '100%', height: '100%', }}
                            onPress={() => { Keyboard.dismiss() }}>
                            <View style={{
                                height: "100%", width: "100%",
                                alignItems: 'center'
                            }}>

                                <View style={styles.resetView}>
                                    <TouchableOpacity style={styles.resetReturnButton}
                                        onPress={() => setchangingPassword(false)}
                                    >
                                        <Image
                                            source={require('../../../../assets/navigation/right-arrow.png')}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                transform: [{ rotateZ: '180deg' }],

                                            }}
                                        />
                                    </TouchableOpacity>

                                    <Text style={{ fontWeight: 'bold', marginTop: 15, fontSize: 18 }}>Changer de mot de passe</Text>


                                    <TextInput
                                        style={[styles.inputFields, { marginTop: 100 }]}
                                        value={oldPassword}
                                        placeholder="Ancien mot de passe"
                                        onChangeText={(value) => setOldPassword(value)}
                                        textContentType="password"
                                        secureTextEntry={!showPassword}
                                    />

                                    <TextInput
                                        style={[styles.inputFields, { marginTop: 50 }]}
                                        value={newPassword}
                                        placeholder="Nouveau mot de passe "
                                        onChangeText={(value) => setNewPassword(value)}
                                        textContentType="newPassword"
                                        secureTextEntry={!showPassword}

                                    />

                                    <TextInput
                                        style={styles.inputFields}
                                        value={confirmPassword}
                                        placeholder="Confirmer nouveau mot de passe"
                                        onChangeText={(value) => setconfirmPassword(value)}
                                        textContentType="newPassword"
                                        secureTextEntry={!showPassword}

                                    />

                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            marginTop: 20
                                        }}
                                    >
                                        <Ionicons
                                            name={showPassword ? "eye-off" : "eye"}
                                            size={24} color="#ffaf31"
                                        />
                                        <Text style={{
                                            color: '#ffaf31',
                                            marginLeft: 10
                                        }}>
                                            {showPassword ? "Cacher" : "Afficher"}
                                        </Text>
                                    </TouchableOpacity>




                                    <Text style={{ fontSize: 12, marginTop: 20 }}>{statusText}</Text>

                                    <TouchableOpacity style={styles.submitBtn}
                                        onPress={() => handleChange()}
                                    >
                                        <Text style={styles.submitBtnTxt}>Valider</Text>
                                    </TouchableOpacity>

                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>

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