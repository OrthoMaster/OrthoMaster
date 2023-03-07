import { ErrorBoundary } from 'react-error-boundary'
import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Button, Text, Alert, Linking, SafeAreaView } from "react-native";
import { setJSExceptionHandler } from 'react-native-exception-handler';
import { logout } from "../actions/auth";
import store from "../store";
import Bugsnag from '@bugsnag/expo';
import axios from 'axios';
import { useStore } from 'react-redux';



const myErrorHandler = (error, info) => {

    if (error == 'token_not_valid') {
        store.dispatch(logout())
    } else {
        Bugsnag.notify(error)
    }

};

function ErrorFallback({ error, resetErrorBoundary }) {
    return (
        <View style={[styles.container]}>
            <View>
                <Text> Une erreur s'est produite</Text>
                <Text>{error.message}</Text>
                <Button title="Relancer l'app" onPress={resetErrorBoundary} />
            </View>
        </View>
    );
}



export const ErrorHandler = ({ children }) => {

    const [isError, setIsError] = useState(false)
    const [errorMsg, setErrorMsg] = useState("")
    const store = useStore()

    const errorHandler = (e, isFatal) => {
        if (axios.isAxiosError(e)) {

            switch (e.code) {
                case 'ERR_BAD_REQUEST':
                    if (e.response.status == 401 && e.response.data == 'token_not_valid') {
                        Alert.alert(
                            'Votre connexion à Orthomaster à expiré',
                            "Veuillez vous reconnecter",
                            [{
                                text: 'OK',
                                onPress: () => {
                                    store.dispatch(logout())
                                }
                            }]
                        );
                    } else {
                        if (isFatal) {
                            alertAboutFatalError()
                        }
                        Bugsnag.notify(e)
                    }
                    break;
                case 'ERR_NETWORK':
                    onError('Nous rencontrons des problèmes de connexion...')
                    break;
                default:
                    if (isFatal) {
                        alertAboutFatalError()
                    }
                    Bugsnag.notify(e)
                    break;
            }
        }
    };

    useEffect(() => {
        setJSExceptionHandler(errorHandler, true);
    }, [])



    const onError = useCallback((msg) => {
        setIsError(true)
        setErrorMsg(msg)
        setTimeout(() => {
            setIsError(false);
            setErrorMsg(false);
        }, 5000);
    }, []);


    const alertAboutFatalError = () => {
        Alert.alert(
            'Un problème survenu',
            "Vous pouvez nous laisser un message pour nous expliquer ce qu'il s'est passé",
            [{
                text: 'Signaler un problème',
                onPress: () => {
                    Linking.openURL('mailto:question@orthomaster.fr')
                    //reloadAsync()
                }
            },
        ]
        );
    }

    useEffect(() => {
        Bugsnag.start({
            onError: function (event) {
                const user = store.getState().auth.userCurrentSession
                if (user) {
                    event.setUser(user.id_user, user.email, user.name + ' ' + user.lastname)
                }
            },
            autoDetectErrors: false
        });
    }, [])




    return (
        <View style={styles.errorHandlerContainer}>
            <ErrorBoundary
                FallbackComponent={ErrorFallback}
                onError={myErrorHandler}
            >
                {children}
                {isError ?
                    <SafeAreaView style={styles.errorNotifContainer}>
                        <Text style={styles.errorNotifText}>{errorMsg}</Text>
                    </SafeAreaView>
                    : null
                }
            </ErrorBoundary>
        </View>
    )
};



const styles = StyleSheet.create({
    errorHandlerContainer: {
        flex: 1
    },
    errorNotifContainer: {
        backgroundColor: 'red',
        alignItems: 'center'
    },
    errorNotifText: {
        color: '#ffffff',
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 5
    }
});


