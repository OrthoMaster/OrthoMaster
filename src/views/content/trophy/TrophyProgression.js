import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    ActivityIndicator
} from "react-native";
import { TrophyUnlockModal } from "./TrophyUnlockModal";
import { getS3Image } from "../../../services/S3Service";

import { useQuery } from "react-query";
import { getUserTrophy } from "../../../services/TrophyService";

const TrophyDisplay = ({ trophy }) => {
    const [trophyImgUrl, setTrophyImgUrl] = useState(null)
    const [trophyAlreadyUnlock, setTrophyAlreadyUnlock] = useState(false)
    const userTrophy = useQuery(['getUserTrophy', trophy.trophy.id_trophy], ()=> getUserTrophy(null), {
        onSuccess: (data) => {
            const found = data.find(element => element.trophy.id_trophy == trophy.trophy.id_trophy && element.unlock != null);
            if (found) {
                setTrophyAlreadyUnlock(true)
            }
        },
        onError: (err) => {
            throw err
        }
    })
    const fetchTrophyImg = async () => {

        let path = 'trophies/trophy/' + trophy.trophy.title + '.png'

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
    }, [])


    if (trophyImgUrl == null || userTrophy.isLoading) return <ActivityIndicator />

    return (
        <View style={styles.trophyBox}>
            <View>
                <Image
                    source={{
                        uri: trophyImgUrl
                    }}
                    style={styles.trophyImg}
                />
            </View>
            <Text style={styles.trophyTitle} numberOfLines={2}>
                {trophy.trophy.title}
            </Text>
            <Text style={styles.trophyPercentageText}>{Math.round(trophy.progression)}%</Text>
            {
                Math.round(trophy.progression) == 100 && trophyAlreadyUnlock == false ?
                <TrophyUnlockModal
                    trophy={trophy}
                    imgUrl={trophyImgUrl}
                />
                : null
            }
        </View>
    )
}


export const TrophyProgression = ({ trophies }) => {
    const [isLoading, setIsLoading] = useState(true)



    useEffect(() => {

        if (trophies != null) {
            setIsLoading(false)
        }
    }, [trophies])

    if (isLoading) return <ActivityIndicator />;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Voilà ton niveau de progression</Text>
            <View style={styles.trophiesContainer}>
                {
                    trophies.map((elem, index) => {
                        return <TrophyDisplay key={index} trophy={elem} />
                    })}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        //backgroundColor: 'red',
        width: '100%',
    },
    title: {
        fontSize: 15,
        paddingLeft: 20,
        fontWeight: 'bold',
        alignSelf: 'center',
        color: '#ffffff'
    },
    trophiesContainer: {
        flexDirection: 'row',
        //height: 70,
        width: '80%',
        alignSelf: 'center'
    },
    trophyBox: {
        flex: 1,
        margin: 5,
        padding: 10,
    },
    trophyImg: {
        width: '100%',
        height: 80,
        resizeMode: 'contain',
        borderRadius: 5
    },
    trophyImgCache: {
        backgroundColor: 'rgba(0,0,0,0.4)',
        position: 'absolute',
        justifyContent: 'center'
    },
    trophyTitle: {
        textAlign: 'center',
        fontSize: 15,
        fontWeight: 'bold',
        paddingVertical: 5,
        color: '#ffffff'
    },
    trophyPercentageText: {
        fontWeight: 'bold',
        fontSize: 25,
        alignSelf: 'center',
        textAlign: 'center',
        color: '#ffffff'
    }

})