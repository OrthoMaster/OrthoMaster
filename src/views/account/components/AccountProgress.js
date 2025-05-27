import React, { useState, useEffect } from 'react'
import {
    Text,
    View,
    StyleSheet,
    Dimensions
} from 'react-native'

import { useQuery } from "@tanstack/react-query"
import { getUserProgression } from '../../../services/ProgressionService'

export const AccountProgress = ({ userId, refreshing }) => {
    const progress = useQuery({
        queryKey: ['Account', 'GET', 'userProgress'],
        queryFn: () => getUserProgression()
    })
    useEffect(() => {
        if (refreshing) {
            progress.refetch()
        }
    }, [refreshing])


    if (!progress.data) {
        return null
    }

    return (
        <View style={styles.container}>
            <View style={[styles.statBox, { justifyContent: 'flex-start' }]}>
                <View style={[styles.stat, { backgroundColor: '#5696df' }]}>
                    <Text style={styles.statText}>
                        <Text style={{ fontWeight: 'bold' }}>{Math.round(progress.data.app_logtime / 3600)}</Text>h
                        <Text style={{ fontWeight: 'bold' }}> {Math.round(progress.data.app_logtime % 3600 / 60)}</Text>m
                    </Text>
                    <Text style={styles.statTitle}>passées sur OrthoMaster</Text>

                </View>
            </View>

        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        width: '90%'
    },
    statBox: {
        alignItems: 'center',
        flexDirection: 'column',
        flex: 1,
        width: "80%",
        justifyContent: 'center',
    },
    stat: {
        width: "100%",
        marginTop: 5,
        padding: 20,
        justifyContent: 'center',
        backgroundColor: 'red',
        borderRadius: 10,
        alignItems: 'center'
    },
    statText: {
        fontWeight: '600',
        fontSize: 30,
        textAlign: 'center',
        color: '#ffffff'
    },
    statTitle: {
        fontWeight: '700',
        fontSize: 12,
        width: '90%',
        textAlign: 'center',
        color: '#fff'
    }

})