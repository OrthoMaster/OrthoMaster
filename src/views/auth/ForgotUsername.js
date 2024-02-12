import React, { useState } from "react";
import {
    Text,
    StatusBar,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ActivityIndicator
} from "react-native";

import { useMutation } from "react-query";
import AuthService from "../../services/AuthService";


export const ForgotUsername = () => {
    const [userEmail, setUserEmail] = useState("")
    const [statusMessage, setStatusMessage] = useState(null)
    const [loading, setLoading] = useState(false)

    const requestUsername = useMutation(AuthService.retreiveUsernameByEmail, {
        onSuccess: (res) => {
            if (res.data == true) {
                setStatusMessage("email envoyé")
                setTimeout(()=>{
                    setStatusMessage(null)
                }, 5000)
            }
        },
        onError: (err) => {
            if (err.response.data.message) {
                setStatusMessage(err.response?.data?.message)
                setTimeout(()=>{
                    setStatusMessage(null)
                }, 5000)
            }
        },
        onSettled: () => setLoading(false)
    })

    return <SafeAreaView style={{
        backgroundColor: '#fff',
        flex: 1,
        alignItems: 'center'
    }}>
        <Text style={[styles.primaryText, { marginTop: 30 }]}>Vous avez oublié votre nom d'utilisateur ?</Text>
        <Text style={[styles.secondaryText, { marginTop: 30 }]}>
            Renseignez l'adresse e-mail de votre compte OrthoMaster dans le champ ci-dessous.
        </Text>
        <Text style={{ fontSize: 30, marginVertical: 30 }}>⬇️</Text>
        <TextInput
            style={styles.intputField}
            placeholder="Adresse e-mail"
            value={userEmail}
            onChangeText={(val) => setUserEmail(val)}
            autoCapitalize={'none'}
        />
        {
            statusMessage &&
            <Text style={{
                marginVertical: 10,
                fontWeight: 'bold'
            }}>{statusMessage}</Text>
        }

        <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => {
                requestUsername.mutate(userEmail)
                setLoading(true)
            }}
        >
            <Text style={styles.resetButtonText}>Continuer</Text>
            {
                loading &&
                <ActivityIndicator style={{ marginLeft: 20 }} color={"#fff"} />
            }
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
    secondaryText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#1B1C1E'
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
    submitBtn: {
        width: '90%',
        height: 60,
        backgroundColor: "#EA6911",
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        marginTop: 10,
        marginBottom: 30,
        flexDirection: 'row'
    },
    resetButtonText: {
        fontWeight: 'bold',
        fontSize: 18,
        color: '#fffefd'
    },
})