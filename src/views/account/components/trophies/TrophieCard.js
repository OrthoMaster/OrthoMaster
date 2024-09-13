import React, { useState, useEffect } from 'react'
import {
    ActivityIndicator,
    View,
    Text,
    Image,
    StyleSheet
} from 'react-native'
import { getS3Image } from '../../../../services/S3Service'

export const TrophyCard = ({ item, refreshing }) => {
    const [trophyImgUrl, setTrophyImgUrl] = useState(null)
    const fetchTrophyImg = async () => {
        const path = 'trophies/trophy/' + item.trophy.title + '.png'
        try {
            const imageUrl = await getS3Image(path)
            return imageUrl
        } catch (error) {
            throw error
        }
    }

    useEffect(() => {
        var isMounted = true
        fetchTrophyImg().then((url) => {
            if (isMounted)
                setTrophyImgUrl(url)
        })
        return () => {
            isMounted = false
        }
    }, [refreshing])

    if (trophyImgUrl == null) return <ActivityIndicator />


    return (
        <View style={styles.trophyBox}>
            <View style={styles.trophyImgContainer}>
                {
                    trophyImgUrl &&
                    <Image
                        style={styles.trophyImg}
                        source={{ uri: trophyImgUrl }}
                    />
                }
                {
                    item.unlock != true ?
                        <View style={[styles.trophyImgCover, { height: (100 - item.progress - 3) + '%' }]} />
                        : null
                }
            </View>
            <Text style={styles.trophyTitle} numberOfLines={2}>{item.trophy.title}</Text>
            <Text style={styles.trophyProgression}>{Math.round(item.progress)}%</Text>

        </View>
    )
}

const styles = StyleSheet.create({
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
        color: '#ffaf31'
    }
})