import React, { useEffect, useState } from 'react';
import {
    Text,
    Dimensions,
    StyleSheet,
    Image,
    TouchableOpacity
} from 'react-native';
import { useQuery } from 'react-query';
import Carousel from '../../snap-carousel/src/carousel/Carousel';
import { getS3Image } from '../services/S3Service'
import { S3ContentPathGenerator } from '../utils';



const CarousselCard = ({ item, navigation }) => {
    const imageUrl = useQuery(['fetchHomeContentThumbnail', item.id_content], () => getS3Image(S3ContentPathGenerator(item)+'logo.png'))

    return (
        <TouchableOpacity style={styles.card}
            onPress={() => navigation.navigate('home-content', {
                content: item
            })}
        >

            <Image
                style={styles.thumbnail}
                source={{ uri: imageUrl.data }}
            />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
        </TouchableOpacity>
    );
}


export const OrthoCarousel = ({ entries, navigation }) => {


    return <Carousel
        data={entries}
        renderItem={item => <CarousselCard item={item.item} navigation={navigation} />}
        sliderWidth={Dimensions.get('screen').width}
        itemWidth={300}
    />
}

const styles = StyleSheet.create({
    card: {
        height: 200
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
        height: '80%',
        resizeMode: 'cover',
        borderRadius: 8
    }
})