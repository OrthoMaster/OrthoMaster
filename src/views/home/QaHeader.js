import React, { useState } from 'react';

import {
    Text,
    SafeAreaView,
    Image,
    StyleSheet,
    View,
    TouchableOpacity
} from 'react-native'


export const QaHeader = ({ onBack, onSearch }) => {


    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>

                <TouchableOpacity
                    onPress={onBack}
                    style={{ height: '100%', width: '15%' }}
                >
                    <Image
                        source={require('../../../assets/navigation/arrow.png')}
                        style={styles.backButton}
                    />
                </TouchableOpacity>
                <Text style={styles.title}>Questions / réponses</Text>
                <TouchableOpacity
                    onPress={onSearch}
                >
                    <Image
                        source={require('../../../assets/navigation/search.png')}
                        style={styles.searchButton}
                    />
                </TouchableOpacity>

            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fffefd',
        width: '100%',
        height: 100,
        borderBottomWidth: 2,
        borderBottomColor: '#E6E6E6'

    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        height: '100%',
    },
    title: {
        fontWeight: '600',
        fontSize: 22
    },
    searchButton: {
        marginRight: 20
    },
    backButton: {
        marginLeft: 15
    }
})