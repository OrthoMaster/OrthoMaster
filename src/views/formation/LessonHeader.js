import React, { useEffect } from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Text, SafeAreaView, StatusBar, Platform } from 'react-native'

export const LessonHeader = ({ onSearch, title, navigation }) => {
    useEffect(() => {
        navigation.setParams({ search: false })
    }, [])


    return <SafeAreaView style={[styles.container, styles.AndroidSafeArea]}>
        <View style={styles.header}>

            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity
                onPress={onSearch}
            >
                <Image
                    source={require('../../../assets/navigation/search.png')}
                    style={styles.search}
                />
            </TouchableOpacity>

        </View>
    </SafeAreaView>
}

const styles = StyleSheet.create({
    AndroidSafeArea: {
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
    },
    container: {
        backgroundColor: '#ffaf31',
        width: '100%',
        height: '12%',


    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    title: {
        marginLeft: 15,
        fontWeight: '600',
        fontSize: 22,
        color: '#fffeee'
    },
    search: {
        marginRight: 20
    }
})