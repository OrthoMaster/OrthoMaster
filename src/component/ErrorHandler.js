import { ErrorBoundary } from 'react-error-boundary'
import * as React from "react";
import { View, StyleSheet, Button, Text, Alert, Linking } from "react-native";
import {setJSExceptionHandler} from 'react-native-exception-handler';
import { logout } from "../actions/auth";
import store from "../store";
import Bugsnag from '@bugsnag/expo';
import { reloadAsync } from 'expo-updates';


const myErrorHandler = (error, info) => {
    if (error == 'token_not_valid') {
        store.dispatch(logout())
    } else {
        console.log('Error Handler:',error.response);
        Bugsnag.notify(error)
    }
    
};

function ErrorFallback({error, resetErrorBoundary }) {
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
export const ErrorHandler = ({ children }) => (
    <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onError={myErrorHandler}
    >
        {children}
    </ErrorBoundary>
);




const errorHandler = (e, isFatal) => {
    //console.log('Exception handler:', e.response);
    if (isFatal) {
        if (e.response.data == 'token_not_valid') {
            Alert.alert(
                'Votre session à expiré',
                "Veuillez vous reconnecter",
                [{
                    text: 'OK',
                    onPress: () => {
                        store.dispatch(logout())
                    }
                }]
            );
            
        } else {
            
            let txt = ""
            if (e.response._response == "The Internet connection appears to be offline.") {
                txt = "Nous n'arrivons pas à accéder à internet."
            } else {
                txt = "Vous pouvez nous laisser un message pour nous expliquer ce qu'il s'est passé"
                Bugsnag.notify(e)
            }
            Alert.alert(
                'Oups...',
                txt,
                [{
                    text: 'Signaler un problème',
                    onPress: () => {
                        Linking.openURL('mailto:question@orthomaster.fr')
                        reloadAsync()
                    }
                },
                {
                    text: "Relancer l'app",
                    onPress: () => {
                        reloadAsync()
                    },
                    style: 'cancel'
                }]
            );
        }
    } else {
        console.log("[ NOT fatal error]:",e.response);
        Bugsnag.notify(e)
    }
};
  
  setJSExceptionHandler(errorHandler, true);



const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "center",
        alignContent: "center",
        paddingHorizontal: 12,
    },
});


