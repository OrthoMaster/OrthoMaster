import React, { useState, useEffect } from 'react'
import {
    Text,
    View,
    StyleSheet,
    Dimensions
} from 'react-native'

import { useQuery } from 'react-query'
import { getUserProgression } from '../../../services/ProgressionService'
import { useDispatch } from 'react-redux'
import { logout } from '../../../actions/auth'
import { LoadingView } from '../../LoadingView'

export const AccountProgress = ({ userId }) => {
    const dispatch = useDispatch()
    const progress = useQuery('getUserProgress', () => getUserProgression(), {
        onError: (error) => {
            if (error.response.data == 'token_not_valid') {
              dispatch(logout())
            }
          }
    })


    if (progress.isLoading) return <LoadingView />
    if (progress.error) return <Text>Error</Text>

    return (
        <View style={styles.container}>
            <View style={[styles.statBox, {justifyContent: 'flex-start'}]}>
                <View style={[styles.stat, {backgroundColor: '#E9600D'}]}>
                    <Text style={styles.statText}><Text style={{fontWeight: 'bold'}}>{Math.round(progress.data.formation_logtime / 3600)}</Text>h</Text>
                    <Text style={styles.statText}><Text style={{fontWeight: 'bold'}}>{Math.round(progress.data.formation_logtime % 3600 / 60)}</Text>m</Text>
                </View>
                <Text style={styles.statTitle}>passées sur ma formation</Text>
            </View>
            <View style={[styles.statBox, {justifyContent: 'flex-end'}]}>
                <Text style={styles.statTitle}>ma formation complétée à</Text>
                <View style={[styles.stat, {backgroundColor: '#E9841C'}]}>
                    <Text style={styles.statText}><Text style={{fontWeight: 'bold'}}>{Math.round(progress.data.formation_progress)}</Text>%</Text>
                </View>
            </View>
            <View style={[styles.statBox, {justifyContent: 'flex-start'}]}>
                <View style={[styles.stat, {backgroundColor: '#215C9E'}]}>
                    <Text style={styles.statText}><Text style={{fontWeight: 'bold'}}>{Math.round(progress.data.app_logtime / 3600)}</Text>h</Text>
                    <Text style={styles.statText}> <Text style={{fontWeight: 'bold'}}>{Math.round(progress.data.app_logtime % 3600 / 60)}</Text>m</Text>
                </View>
                <Text style={styles.statTitle}>passées sur OrthoMaster</Text>
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
        width: Dimensions.get('screen').width / 2,
        height: Dimensions.get('screen').width / 2,
        justifyContent: 'center',
    },
    stat: {
        width: 100,
        height: 100,
        marginTop: 5,
        borderRadius: 100,
        justifyContent: 'center',
        backgroundColor: 'red',
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
    }

})