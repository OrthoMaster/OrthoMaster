import React, { useEffect, useState, useCallback } from 'react'
import {
    View,
    Text,
    Dimensions,
    Image,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Alert
} from "react-native";

import {
    QueryCache,
    QueryClientProvider,
    MutationCache
} from 'react-query'
import { QueryClient} from "react-query"
import AuthService from '../services/AuthService';
import { useDispatch } from 'react-redux';
import { logout } from '../actions/auth';


export const MyQueryProvider = ({
    children
}) => {
    const [isError, setIsError] = useState(false)
    const [errorMsg, setErrorMsg] = useState("")
    const dispatch = useDispatch()

    var gettingNewToken = false

    const [client, setClient] = useState(new QueryClient({
        defaultOptions: {
            queries: {
                retryDelay: 2000,
                // retry: 3
                retry: (failureCount, error) => {
                    if (failureCount >= 3) {
                        return false
                    }
                    if (error.response.data == 'token_not_valid' && gettingNewToken == false) {
                        gettingNewToken = true
                        getNewToken()
                    }

                    return true
                }
            },
            mutations: {
                retryDelay: 200,
                retry: (failureCount, error) => {
                    if (failureCount >= 3) {
                        return false
                    }
                    if (error.response.data == 'token_not_valid' && gettingNewToken == false) {
                        gettingNewToken = true
                        getNewToken()
                        return false
                    }

                    return true
                }
            }
        },
        queryCache: new QueryCache({
            onError: (error) => {
                console.log('Provider', error);
                if (error.code == 'ERR_NETWORK') {
                    onError('Nous rencontrons des problèmes de connexion...')
                }
            }
        }),
        mutationCache: new MutationCache({
            onError: (error) => {
                if (error.code == 'ERR_NETWORK') {
                    onError('Nous rencontrons des problèmes de connexion...')
                }
            }
        })
    }))


   

    const getNewToken = async () => {
        console.log('get token');
        const res = await AuthService.getNewToken()
        if (res == true) {
            gettingNewToken = false
        } else {
            //Alert.alert("Votre session à expiré, veuillez vous reconnecter.")
            dispatch(logout())
        }
    }

    const onError = useCallback((msg) => {
        setIsError(true)
        setErrorMsg(msg)
        setTimeout(() => {
            setIsError(false);
            setErrorMsg(false);
        }, 5000);
    }, []);


    if (client == null) return;
    return (
        <QueryClientProvider client={client} >
            {children}
            {isError ?
                <SafeAreaView style={styles.errorNotifContainer}>
                    <Text style={styles.errorNotifText}>{errorMsg}</Text>
                </SafeAreaView>
                : null
            }
        </QueryClientProvider>
    )
}

const styles = StyleSheet.create({
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
})

