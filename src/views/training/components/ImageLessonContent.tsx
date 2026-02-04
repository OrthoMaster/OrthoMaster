import React, { useState } from 'react'
import { View, Dimensions, Image, TouchableOpacity } from 'react-native'
import { ImageViewer } from '../../../component/ImageViewer';


export const ImageLessonContent = ({ url, config }) => {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [imageHeight, setImageHeight] = useState(0);

  var imgWidth = Dimensions.get('window').width
  if (config.attributes.width) {
    if (config.attributes.width.includes('%')) {
      let num = config.attributes.width.replace('%', '')
      imgWidth = (Dimensions.get('window').width * num) / 100
    } else {
      imgWidth = parseInt(config.attributes.width)
    }
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
            height: imageHeight,
            resizeMode: 'contain'
          }}
          resizeMode='contain'
          source={{ uri: url }}
          onLoad={(e) => {
            const { width, height } = e.nativeEvent.source;
            setImageHeight((imgWidth * height) / width);
          }}
        />
      </TouchableOpacity>
      {isFullscreen && <ImageViewer url={url} visible={isFullscreen} onClose={() => { setIsFullscreen(false) }} />}
    </View>
  )
}