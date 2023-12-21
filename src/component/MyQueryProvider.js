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
                    console.log('err',error);
                    console.log('err response',error.response);
                    console.log(failureCount);
                    console.log(gettingNewToken);
                    if (failureCount >= 3) {
                        return false
                    }
                    if (error.response.status == 401 && gettingNewToken == false) {
                        gettingNewToken = true
                        getNewToken()
                    }

                    return true
                }
            },
            mutations: {
                retryDelay: 200,
                retry: (failureCount, error) => {
                    console.log('mut err',error);
                    console.log('mut err response',error.response);
                    if (failureCount >= 3) {
                        return false
                    }
                    if (error.response.status == 401 && gettingNewToken == false) {
                        gettingNewToken = true
                        getNewToken()
                    }

                    return true
                }
            }
        },
        queryCache: new QueryCache({
            onError: (error) => {
                if (error.code == 'ERR_NETWORK') {
                    onErrorMsg('Nous rencontrons des problèmes de connexion...')
                }
            }
        }),
        mutationCache: new MutationCache({
            onError: (error) => {
                if (error.code == 'ERR_NETWORK') {
                    onErrorMsg('Nous rencontrons des problèmes de connexion...')
                }
            }
        })
    }))


   

    const getNewToken = async () => {
        try {
            const res = await AuthService.getNewToken()
            console.log("Récupération token :", res);
            if (res == false) {
                console.log("Logout");
                dispatch(logout())
            }
            gettingNewToken = false
            
        } catch (error) {
            console.log('errrrrr catch query provider', error);
        }
    }

    const onErrorMsg = useCallback((msg) => {
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

