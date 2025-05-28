import React, { useEffect, useState, useLayoutEffect } from 'react'
import { Text, SafeAreaView, View, StyleSheet, TouchableOpacity, Image, TextInput, StatusBar, Platform } from 'react-native'


export const SearchHeader = ({ navigation, onReturn, placeholder, onChangeText }) => {
    const [text, settext] = useState()
    const [sendable, setSendable] = useState(true)
    const [timerEnd, setTimerEnd] = useState(false)

    useEffect(() => {
        if (timerEnd) {
            onChangeText(text)
            setSendable(true)
            setTimerEnd(false)
        }
    }, [timerEnd])


    const handleSearchText = (text) => {
        settext(text)
        if (sendable) {
            setSendable(false)
            setTimeout(() => {
                setTimerEnd(true) // setting timer to delay request api
            }, 2000)
        }
    }

    return <SafeAreaView style={styles.container}>
        <View style={[styles.header, styles.AndroidSafeArea]}>
            <TouchableOpacity
                style={styles.button}
                onPress={onReturn}
            >
                <Image
                    source={require('../../../assets/navigation/arrow.png')}
                />
            </TouchableOpacity>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.search}
                    onChangeText={(text) => handleSearchText(text)}
                    value={text}
                    placeholder={placeholder}
                    autoCapitalize={'none'}
                    placeholderTextColor={"gray"}
                />
            </View>

        </View>
    </SafeAreaView>

}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fffefd',
        width: '100%',
        height: 90,
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        height: '100%',
        alignItems: 'center',
    },
    button: {
        flex: 1,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center'
    },
    searchContainer: {
        flex: 1,
        flexBasis: '70%',
        height: '80%',
        borderRadius: 50,
        marginRight: 15,
        backgroundColor: '#f1f1f1',
        justifyContent: 'center',
        alignItems: 'center'
    },
    search: {
        width: '90%',
    },
    AndroidSafeArea: {
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
    }
})