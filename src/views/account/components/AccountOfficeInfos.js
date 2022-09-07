import React, {useState, useEffect} from 'react'

import {
    View,
    StyleSheet,
    Text,
    ActivityIndicator
} from 'react-native'



export const AccountOfficeInfos = ({officeId})=> {


    if (infos.isLoading) return <ActivityIndicator />
    if (infos.error) return <Text>Error</Text>
    return (
    <View style={styles.container}>
        <Text style={styles.title}>{infos.data.name}</Text>
        <Text style={styles.text}>{infos.data.address_way}</Text>
        <Text style={styles.text}>{infos.data.address_city+' '+infos.data.address_postal_code}</Text>
        <Text style={styles.text}>{infos.data.email}</Text>

    </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#20123A',
        width: '100%',
        paddingVertical: 10,
        alignItems: 'center',
        marginTop: 30
    },
    title: {
        fontWeight: '600',
        fontSize: 20,
        color: '#fffefd'
    },
    text: {
        color: '#fffefd'
    }
})