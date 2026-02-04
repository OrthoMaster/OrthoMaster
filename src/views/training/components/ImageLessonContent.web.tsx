import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { ImageViewer } from '../../../component/ImageViewer';

export const ImageLessonContent = ({ url, config }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const getImageWidth = () => {
    if (config?.attributes?.width) {
      if (config.attributes.width.includes('%')) {
        return config.attributes.width;
      } else {
        return `${config.attributes.width}px`;
      }
    }
    return '100%';
  };

  return (
    <View>
      <TouchableOpacity
        onPress={() => setIsFullscreen(true)}
        style={{
          alignSelf: 'center',
          width: getImageWidth(),
          maxWidth: '100%',
          cursor: 'pointer',
        }}
      >
        <img
          src={url}
          alt="Lesson content"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            objectFit: 'contain',
          }}
        />
      </TouchableOpacity>
      {isFullscreen && (
        <ImageViewer 
          url={url} 
          visible={isFullscreen} 
          onClose={() => setIsFullscreen(false)} 
        />
      )}
    </View>
  );
};