import React, { useState, useEffect } from 'react'
import {
    View,
    Dimensions,
    Image,
    StyleSheet
} from 'react-native'

import { getS3Image } from '../../../../services/S3Service'
import { useDispatch } from 'react-redux'
import { logout } from '../../../../actions/auth'

const AvatarTrophy = ({ trophy }) => {
    const [trophyImgUrl, setTrophyImgUrl] = useState(null)
    const getAvatarCompletionImg = async () => {
        const path = 'trophies/base-completion/' + trophy.trophy.title + '.png'
        try {
            const imageUrl = await getS3Image(path)
            return imageUrl
        } catch (error) {
            throw error
        }
    }


    useEffect(() => {
        var isMounted = true
        getAvatarCompletionImg().then((url) => {
            if (isMounted)
                setTrophyImgUrl(url)
        })
        return () => {
            isMounted = false
        }
    }, [trophy])
    if (trophy.unlock != 1) return null

    return (
        <Image
            style={[styles.avatar, { position: 'absolute' }]}
            source={{ uri: trophyImgUrl }}
        />
    )
}


export const Avatar = ({ trophies }) => {

    return (<View style={styles.container}>
        <Image
            source={require('../../../../../assets/trophies/base.png')}
            style={styles.avatar}
        />

        {
            trophies.map((value, index) => {
                if (value.unlock == true)
                    return <AvatarTrophy key={index} trophy={value} />
                else
                    return null
            })
        }

    </View>
    )
}

const styles = StyleSheet.create({
    container: {
        width: Dimensions.get('screen').width * 0.9,
        height: Dimensions.get('screen').width * 0.9,
        marginBottom: 20,
        shadowOpacity: 0.5,
        shadowRadius: 10
    },
    avatar: {
        borderRadius: 10,
        width: '100%',
        height: '100%',
        
    }
})