import React, { useState, useEffect } from 'react'
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    View,
    TouchableOpacity,
    StatusBar
} from 'react-native'

import { restoreLocalConfigAsync } from '../../utils'
import AuthService from '../../services/AuthService'

export const ResetPassword = () => {
    const [credentials, setCredentials] = useState({
        mail: "",
        oldPassword: "",
        newPassword: ""
    })

    const handleChangePassword = async () => {

        AuthService.changePassword(credentials)
        .then((response) => {
            console.log(response);
        })
        .catch(error => {
            console.log('Error retrieving data!');
        })
    }


    return <SafeAreaView style={[styles.container, styles.AndroidSafeArea]}>
        <View style={styles.headerContainer}>
            <Text style={styles.headerText}>Modifier mon mot de passe</Text>
        </View>
        <TextInput
            style={styles.intputField}
            placeholder="E-mail"
            value={credentials.mail}
            onChangeText={(val) => setCredentials((state) => ({ ...state, mail: val }))}
            autoCapitalize={'none'}
        />
        <TextInput
            style={styles.intputField}
            placeholder="Ancien mot de passe"
            value={credentials.oldPassword}
            onChangeText={(val) => setCredentials((state) => ({ ...state, oldPassword: val }))}
            autoCapitalize={'none'}
            secureTextEntry
        />
        <TextInput
            style={styles.intputField}
            placeholder="Nouveau mot de passe"
            value={credentials.newPassword}
            onChangeText={(val) => setCredentials((state) => ({ ...state, newPassword: val }))}
            autoCapitalize={'none'}
            secureTextEntry
        />
        <TouchableOpacity
            style={styles.resetInButton}
            onPress={() => handleChangePassword()}
        >
            <Text style={styles.resetButtonText}>Continue</Text>
        </TouchableOpacity>
    </SafeAreaView>
}


const styles = StyleSheet.create({
    AndroidSafeArea: {
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
    },
    container: {
        alignItems: 'center',
        flex: 1
    },
    headerContainer: {
        width: '100%',
        height: '30%',
        justifyContent: 'center'
    },
    headerText: {
        textAlign: 'center',
        fontSize: 25,
        fontWeight: '600',
        color: '#1B1C1E'
    },
    buttonContainer: {

    },
    intputField: {
        borderWidth: 1,
        borderColor: '#BEBEBE',
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
        marginTop: 5,
        marginBottom: 30
    },
    resetButtonText: {
        fontWeight: '600',
        fontSize: 18,
        color: '#fffefd'
    },
})