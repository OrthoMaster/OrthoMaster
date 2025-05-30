import React, { useState, useEffect } from 'react'
import { View, Dimensions, ActivityIndicator, Image, TouchableOpacity } from 'react-native'


import { getS3Image } from '../../../../services/S3Service'


import { useSelector } from "react-redux";
import { selectContent } from '../../../../reducers/contentReducer';
import { ImageViewer } from '../../../../component/ImageViewer';
import { useQuery } from "@tanstack/react-query";


export const ImageFactory = ({ config }) => {
    const imgUrl = useQuery({
        queryKey: ['Content', 'GET', "contentImage", config.attributes['src']],
        queryFn: ()=>getS3Image(contentInfos.s3_path+ '/' + contentInfos.title +'/' + config.attributes['src'])
    })

    const [isFullscreen, setIsFullscreen] = useState(false)

    const contentInfos = useSelector(selectContent)

    var imgWidth = Dimensions.get('window').width

    if (config.attributes.width) {
        if (config.attributes.width.includes('%')) {
            let num = config.attributes.width.replace('%', '')
            imgWidth = (Dimensions.get('window').width * num) / 100
        } else {
            imgWidth = parseInt(config.attributes.width)
        }
    }

    if (imgUrl.isLoading) {
        return <ActivityIndicator />
    }

    return (
        <View>
            
            <TouchableOpacity
                onPress={() => { setIsFullscreen(true) }}
            >
                <Image
                    width={imgWidth}
                    
                    style={{
                        alignSelf: 'center',
                        width: imgWidth,
                        height: imgWidth,
                        resizeMode: 'contain'
                    }}
                    source={{
                        uri: imgUrl.data
                    }} />
            </TouchableOpacity>
            {
                isFullscreen ?
                    <ImageViewer url={imgUrl.data} visible={isFullscreen} onClose={()=>{setIsFullscreen(false)}} />
                    : null
            }
        </View>
    )
}


