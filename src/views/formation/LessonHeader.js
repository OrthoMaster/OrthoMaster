import React, { useEffect } from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Text, SafeAreaView, StatusBar, Platform } from 'react-native'
import { Feather } from '@expo/vector-icons';

export const LessonHeader = ({ onSearch, title, navigation, searchEnabled = true, returnEnabed = false }) => {
    useEffect(() => {
        //navigation.setParams({ search: false })
    }, [])


    return <SafeAreaView style={[styles.container, styles.AndroidSafeArea]}>
        <View style={searchEnabled || returnEnabed ? {
            flexDirection: 'row',
            flex: 1,
            width: '100%',
            alignItems: 'center'
        } : {}}>
            {
                returnEnabed &&
                < TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{
                        padding: 10
                    }}
                >
                    <Feather name="arrow-left" size={25} color="#fff" />
                </TouchableOpacity>
            }

            <Text style={styles.title}>{title}</Text>
            {
                searchEnabled &&
                < TouchableOpacity
                    onPress={onSearch}
                    style={{
                        padding: 10,
                        position: 'absolute',
                        right: 5
                    }}
                >
                    <Image
                        source={require('../../../assets/navigation/search.png')}
                    />
                </TouchableOpacity>
            }

        </View>
    </SafeAreaView >
}

const styles = StyleSheet.create({
    AndroidSafeArea: {
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
    },
    container: {
        backgroundColor: '#8089D1',
        width: '100%',
        height: '12%',
        alignItems: 'center',
        justifyContent: 'center'

    },

    title: {
        fontWeight: 'bold',
        fontSize: 20,
        color: '#fffeee',
        width: "70%",
        alignSelf: 'center'
    }
})