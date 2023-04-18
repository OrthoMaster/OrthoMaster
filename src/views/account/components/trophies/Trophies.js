import React, { useEffect, useState } from 'react'
import {
    FlatList,
    StyleSheet,
    View,
    Text,
    ActivityIndicator,
    Image
} from 'react-native'
import { Avatar } from './Avatar'
import { useQuery } from 'react-query'
import { getUserTrophy } from '../../../../services/TrophyService'
import { TrophyCard } from './TrophieCard'

export const Trophies = ({refreshing}) => {
    const userTrophy = useQuery('getUserTrophy', ()=> getUserTrophy(null))
    

    useEffect(() => {
        if (refreshing) {
          userTrophy.refetch()
        }
      }, [refreshing])


    if (!userTrophy.data) return null
    
    return (
        <View style={styles.container}>
            <Avatar trophies={userTrophy.data}/>
            <FlatList
                data={userTrophy.data}
                renderItem={(item) => <TrophyCard item={item.item} refreshing={refreshing}/>}
                keyExtractor={(item, index) => index}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: 20,
        width: '100%'
    },
    trophyBox: {
        width: 100,
        height: 120,
        alignItems: 'center',
        marginHorizontal: 5,
        justifyContent: 'space-around',
        padding: 10
    },
    trophyImgContainer: {
        width: '70%',
        height: '60%',
        flexDirection: 'column-reverse'
    },
    trophyImg: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        borderWidth: 2
    },
    trophyImgCover: {
        width: '90%',
        backgroundColor: 'rgba(255,255,255,0.9)',
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        borderBottomWidth: 2

    },
    trophyTitle: {
        fontWeight: 'bold',
        fontSize: 10,
        textAlign: 'center',
        paddingVertical: 5
    },
    trophyProgression: {
        fontSize: 20,
        color: '#F76F10'
    }
})