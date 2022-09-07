import React, { useState, useEffect } from 'react'
import { Text, Dimensions, ActivityIndicator, Image } from 'react-native'


import { getS3Image } from '../../../../services/S3Service'


import { useSelector } from "react-redux";
import { selectContent } from '../../../../reducers/contentReducer';

export const ImageFactory = ({ config }) => {
    const [url, seturl] = useState(null);

    const contentInfos = useSelector(selectContent)

    var imgWidth = Dimensions.get('window').width


    const fetchImage = async (contentInfos) => {
        try {
            let path = contentInfos.type + '/' + contentInfos.module_num + '/' + contentInfos.title + '/' + config.attributes['src']
            if (contentInfos.type != 'lesson' || contentInfos.title == "initial" || contentInfos.title == 'final') {
                path = contentInfos.type + '/' + contentInfos.title + '/' + config.attributes['src']
            }
            return await getS3Image(path)

        } catch (error) {
            console.log('fetch image lesson error:', contentInfos, error);
        }
    }


    useEffect(() => {
        let isDisplay = true
        fetchImage(contentInfos).then(result => {
            if (isDisplay) {
                seturl(result)
            }
        })
        return () => { isDisplay = false }
    }, [])


    if (config.attributes.width) {
        if (config.attributes.width.includes('%')) {
            let num = config.attributes.width.replace('%', '')
            imgWidth = (Dimensions.get('window').width * num) / 100
        } else {
            imgWidth = parseInt(config.attributes.width)
        }
    }


    return (
        url ?
            <Image
                width={imgWidth}
                style={{
                    alignSelf: 'center',
                    width: imgWidth,
                    height: imgWidth,
                    resizeMode: 'contain'
                }}
                source={{
                    uri: url
                }} />
            : <ActivityIndicator />
    )
}
