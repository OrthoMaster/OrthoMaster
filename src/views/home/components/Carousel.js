import React, { useEffect, useState } from 'react';
import {
    Text,
    Dimensions,
    StyleSheet,
    Image,
    TouchableOpacity
} from 'react-native';
import Carousel from 'react-native-snap-carousel';
import { getS3Image } from '../../../services/S3Service'



const renderItem = ({ item }, navigation) => {

    return (
        <TouchableOpacity style={styles.card}
            onPress={() => navigation.navigate('home-content', {
                content: item
            })}
        >

            <Image
                style={styles.thumbnail}
                source={{ uri: item.logo }}
            />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
        </TouchableOpacity>
    );
}


export const OrthoCarousel = ({ entries, navigation }) => {
    const [items, setitem] = useState([])

    const prepareItem = (entries) => {
        entries.forEach(async (element) => {
            let path = element.type + '/' + element.title + '/logo.png'
            const response = await getS3Image(path)
            let item = {
                id_content: element.id_content,
                title: element.title,
                description: element.description,
                logo: response,
                type: element.type
            }

            setitem((items) => items.concat(item))

        });


    }

    useEffect(() => {
        prepareItem(entries)
    }, [entries])


    return <Carousel
        data={items}
        renderItem={item => renderItem(item, navigation)}
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