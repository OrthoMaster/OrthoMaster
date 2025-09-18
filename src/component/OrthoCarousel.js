import React, { useEffect, useState } from 'react';
import {
    Text,
    Dimensions,
    StyleSheet,
    Image,
    TouchableOpacity,
    View
} from 'react-native';
import { useQuery } from "@tanstack/react-query";
import SimpleAdaptiveCarousel from './carousel/SimpleAdaptiveCarousel';
import { getS3Image } from '../services/S3Service'

const { width: screenWidth } = Dimensions.get('screen')
const nbCarouselCardOnScreen = 2.5

const CarousselCard = ({ item, onPress }) => {
    const imageUrl = useQuery({
        queryKey: ['Home', 'GET', 'contentThumbnail', item.id_content, item.title],
        queryFn: () => getS3Image(`${item.s3_path}/${item.title}/logo.png`)
    })

    return (
        <TouchableOpacity style={styles.card}
            onPress={() => onPress()}
        >
            {
                imageUrl.data ?
                    <Image
                        style={styles.thumbnail}
                        source={{ uri: imageUrl?.data }}
                    />
                    : <View style={[styles.thumbnail, { backgroundColor: '#F1F1F1' }]} />

            }
            <Text style={styles.title}>{item.title}</Text>
            <View style={{ display: 'flex', flexDirection: 'row' }}>
                <Text style={{ fontSize: 10, color: '#ffaf31', fontWeight: 'bold' }}>{item.author}</Text>
                <Text style={{ fontSize: 10, marginLeft: 10 }}>⏱️ {item.duration}</Text>
            </View>
            <Text style={{
                fontSize: 10, color: 'gray'
            }}
                numberOfLines={2}
                ellipsizeMode="tail"
            >
                {
                    item.tags?.split(";").map((value, index) => {
                        return <Text key={index}>{String(value).charAt(0).toUpperCase() + String(value).slice(1)}, </Text>
                    })
                }
            </Text>
        </TouchableOpacity>
    );
}


export const OrthoCarousel = ({ entries, onSelect }) => {
    const [formattedEntries, setformattedEntries] = useState([])

    useEffect(() => {
        if (entries) {
            let finalArray = []
            for (const entry of entries) {

                finalArray.push({
                    key: entry.id_content,
                    content: <CarousselCard
                        item={entry}
                        onPress={() => onSelect(entry)}
                    />
                })
            }

            setformattedEntries(finalArray)
        }

    }, [entries])




    return <SimpleAdaptiveCarousel
        items={formattedEntries}
        widthPercent={1}
        height={250}
        cardSpacing={5}

    />
}

const styles = StyleSheet.create({
    card: {
        height: '100%',
        width: screenWidth / nbCarouselCardOnScreen,
    },
    title: {
        fontWeight: '600',
        fontSize: 12,
        marginTop: 5
    },
    description: {
        fontWeight: '400',
        fontSize: 10
    },
    thumbnail: {
        width: '100%',
        height: (screenWidth / nbCarouselCardOnScreen) * 9 / 16,
        resizeMode: 'contain',
        borderRadius: 8
    }
})