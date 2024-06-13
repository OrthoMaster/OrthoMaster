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
    //Bugsnag.notify(error)

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

 
    const store = useStore()

    const errorHandler = (e, isFatal) => {
        if (isFatal) {
            alertAboutFatalError()
        }
        //Bugsnag.notify(e)
    };

    useEffect(() => {
        setJSExceptionHandler(errorHandler, true);
    }, [])

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
            {
                text: 'Fermer'
            }
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
                
            </ErrorBoundary>
            {children}
        </View>
    )
};



const styles = StyleSheet.create({
    errorHandlerContainer: {
        flex: 1
    },
    
});


