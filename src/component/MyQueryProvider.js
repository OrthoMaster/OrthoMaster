import React, { useEffect, useState, useCallback } from 'react'
import {
    View,
    Text,
    Dimensions,
    Image,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView
} from "react-native";

import {
    QueryCache,
    QueryClientProvider
} from 'react-query'
import { QueryClient} from "react-query"
import AuthService from '../services/AuthService';
import { useDispatch } from 'react-redux';



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
        },
        queryCache: new QueryCache({
            onError: (error) => {
                if (error.code == 'ERR_NETWORK') {
                    onError('Nous rencontrons des problèmes de connexion...')
                }
            }
        })
    }))


   

    const getNewToken = async () => {
        const res = await AuthService.getNewToken()
        if (res == true) {
            gettingNewToken = false
        } else {
            AuthService.logout()
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


    // const callback = (event) => {
    //     if (
    //         event?.type === 'queryUpdated' &&
    //         event.action.type === 'error'
    //       ) {
    //         console.log(
    //             'inside callback'
    //         );
    //         //console.log(event.query);
    //         //const queryCache = client.getQueryCache()
    //         //console.log(client.getQueryData({ queryKey: ['Account'] }));
    //         //console.log(client.getQueryCache({ queryKey: ['Account'] }));
    //         //console.log(state);
    //         //const queryKeys = queryCache.getAll().map(cache => cache)
    //         //console.log(queryKeys);
    //         // console.log(event.query.options.queryKey);
    //             //client.cancelQueries()
    //             // AuthService.getNewToken().then((token)=> {
    //             //     if (token) {
    //             //         //client.refetchQueries({queryKey: [event.query.options.queryKey]})
    //             //     }
    //             // })
    //       }
    //     // console.log(event.action.error);
    //     // if (event.query.state.errorUpdateCount > 0) {
    //     //     if (event.query.state.error.response.data == "token_not_valid") {
    //     //         console.log('token invalid');
    //     //         console.log(event);
    //     //     }
    //     // }
    //   }

    // useEffect(() => {
    //     let queryCache = client.getQueryCache()
    //     const unsubscribe = queryCache.subscribe(callback)

    //     return unsubscribe
    // }, [])

    // useEffect(() => {
    //   console.log(gettingNewToken);

    // }, [gettingNewToken])



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

