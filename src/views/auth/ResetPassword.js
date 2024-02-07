import React, { useState, useEffect } from 'react'
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    View,
    TouchableOpacity,
    StatusBar,
    Alert
} from 'react-native'


import { useMutation } from 'react-query'
import { resetUserPassword } from '../../services/UserService'

export const ResetPassword = ({navigation}) => {
    const [username, setUsername] = useState('')
    const [resetStatus, setResetStatus] = useState({
        status: false,
        message: ''
    })

    const resetPasswordMutation = useMutation(resetUserPassword, {
        onSuccess: (response) => {
            setResetStatus({
                status: true,
                message: response.data
            })
        },
        onError: () => {
            setResetStatus({
                status: false,
                message: "Aucun nom d'utilisateur ne correspond"
            })
        }
    })

    useEffect(() => {
        if (resetStatus.status) {
            Alert.alert(
                "Nouveau mot de passe",
                resetStatus.message, [{
                    text: "OK",
                    onPress:()=>{
                        navigation.goBack()
                    }
                }]
            )
        }
    }, [resetStatus])



    return <SafeAreaView style={[styles.container, styles.AndroidSafeArea]}>
        <Text style={[styles.primaryText, { marginTop: 30 }]}>
            Renseignez votre nom d'utilisateur dans le champ ci-dessous dessous
        </Text>
        <Text style={{ fontSize: 30, marginVertical: 30 }}>⬇️</Text>
        <TextInput
            style={styles.intputField}
            placeholder="Nom d'utilisateur"
            value={username}
            onChangeText={(val) => setUsername(val)}
            textContentType="username"
            autoCapitalize={'none'}
        />

        {
            (resetStatus.status == false && resetStatus.message != '') &&
            <Text style={{ color: '#E72311' }}>{resetStatus.message}</Text>
        }

        <TouchableOpacity
            style={styles.resetInButton}
            onPress={() => resetPasswordMutation.mutate(username)}
        >
            <Text style={styles.resetButtonText}>Continuer</Text>
        </TouchableOpacity>
    </SafeAreaView>
}


const styles = StyleSheet.create({
    AndroidSafeArea: {
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
    },
    container: {
        alignItems: 'center',
        backgroundColor: '#ffffff',
        display: 'flex',
        flex: 1,
    },
    primaryText: {
        textAlign: 'center',
        fontSize: 20,
        color: '#1B1C1E'
    },
    buttonContainer: {

    },
    intputField: {
        borderWidth: 1,
        borderColor: '#212525',
        width: '90%',
        height: 60,
        borderRadius: 12,
        paddingLeft: 16,
        marginVertical: 5
    },
    resetInButton: {
        width: '90%',
        height: 60,
        backgroundColor: "#EA6911",
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        marginTop: 30,
        marginBottom: 30
    },
    resetButtonText: {
        fontWeight: 'bold',
        fontSize: 18,
        color: '#fffefd'
    },
})