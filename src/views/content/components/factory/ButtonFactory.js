import React, { useState, useEffect } from 'react'
import { Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import navigateToContent from '../navigation/NavigationFactory'
import { getS3Image } from '../../../../services/S3Service'


export default function buttonFactory(btn, contentInfos) {
    let btnHref = btn.attributes['href'] // handle click btn with the href
    let btnSrc = btn.attributes['src']
    let btnHeight = btn.attributes['height']
    let btnWidth = btn.attributes['width']
    const [url, seturl] = useState('https://www.yesplomberie.fr/wp-content/uploads/2019/05/%EF%BC%9F-300x206.png');

    const fetchImage = async () => {
        try {
            let path = contentInfos.type + '/' + contentInfos.module_id + '/' + contentInfos.title + '/' + btnSrc
            if (contentInfos.type != 'lesson') {
                path = contentInfos.type + '/' + contentInfos.title + '/' + btnSrc
            }
            const imageUrl = await getS3Image(path)
            seturl(imageUrl)
        } catch (error) {
            console.error('ButtonFactory: ' + error);
        }

    }

    useEffect(() => {
        if (btnSrc) {
            fetchImage()
        }


    }, [url])


    var styles = {
        button: {
            backgroundColor: '#ED7D32',
            padding: 10,
        },
        text: {
            color: '#FFFEFD',

        },
        image: {
            height: btnHeight ? parseInt(btnHeight) : 100,
            width: btnWidth ? parseInt(btnWidth) : 100
        }
    }



    let display

    if (btnSrc) {
        styles.button = {
            backgroundColor: 'transparent'
        }
        display = <Image source={{ uri: url }} style={{
            resizeMode: "contain",
            height: styles.image.height,
            width: styles.image.width
        }} />
    } else {
        display = <Text style={styles.text}>{btn.value}</Text>
    }

    return <TouchableOpacity
        style={[styles.button, { marginVertical: 20 }]}
        onPress={() => navigateToContent(btnHref)}>
        {display}
    </TouchableOpacity>

}

