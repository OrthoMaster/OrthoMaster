import React, { useEffect, useState } from 'react'
import { View, StyleSheet, TouchableOpacity, Image, TextInput, StatusBar, Platform } from 'react-native'

import Feather from '@expo/vector-icons/Feather';
import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

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

    return <View style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity
                style={styles.button}
                onPress={onReturn}
            >
                <Feather name="chevron-left" size={24} color={Colors.text} />
            </TouchableOpacity>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    onChangeText={(text) => handleSearchText(text)}
                    value={text}
                    placeholder={placeholder}
                    autoCapitalize={'none'}
                    placeholderTextColor={Colors.gray}
                />
            </View>
        </View>
    </View>

}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingVertical: Spacings.md,

    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    button: {
        width: 40,
        height: 40,
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginLeft: Spacings.lg,
    },
    searchContainer: {
        flex: 1,
        borderRadius: 50,
        backgroundColor: Colors.grayLight,
        justifyContent: 'center',
        alignItems: 'flex-start',
        marginRight: Spacings.lg,
        paddingLeft: Spacings.lg,
        height: 40,
    },
})