import React, { useEffect, useState } from 'react';
import {
    Text,
    Dimensions,
    StyleSheet,
    Image,
    TouchableOpacity,
    View
} from 'react-native';
import { useQuery } from 'react-query';
import Carousel from '../../snap-carousel/src/carousel/Carousel';
import { getS3Image } from '../services/S3Service'



const CarousselCard = ({ item, navigation }) => {
    const imageUrl = useQuery(['Home', 'GET', 'contentThumbnail', item.id_content, item.title], () => getS3Image(`${item.s3_path}/${item.title}/logo.png`))

    return (
        <TouchableOpacity style={styles.card}
            onPress={() => navigation.navigate('home-content', {
                content: item
            })}
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
            <View style={{display: 'flex', flexDirection: 'row'}}>
                <Text style={{fontSize: 12, color: '#ffaf31', fontWeight: 'bold'}}>{item.author}</Text>
                <Text style={{fontSize: 12, marginLeft: 10}}>⏱️ {item.duration}</Text>
            </View>
            <Text style={{
                fontSize: 10, color: 'gray'
            }}
            numberOfLines={2}
            ellipsizeMode="tail"
            >
                {
                    item.tags?.split(";").map((value, index) => {
                        return <Text key={index}>{String(value).charAt(0).toUpperCase()+String(value).slice(1)}, </Text>
                    })
                }
            </Text>
        </TouchableOpacity>
    );
}


export const OrthoCarousel = ({ entries, navigation }) => {
    if (!entries) {
        return null
    }

    return <Carousel
        data={entries}
        renderItem={item => <CarousselCard item={item.item} navigation={navigation} />}
        sliderWidth={Dimensions.get('screen').width}
        itemWidth={300}
    />
}

const styles = StyleSheet.create({
    card: {
    },
    title: {
        fontWeight: '600',
        fontSize: 16,
        marginTop: 5
    },
    description: {
        fontWeight: '400',
        fontSize: 12
    },
    thumbnail: {
        width: '100%',
        height: 150,
        resizeMode: 'cover',
        borderRadius: 8
    }
})