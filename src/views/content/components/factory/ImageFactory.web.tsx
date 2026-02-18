import React, { useState } from 'react';
import { View, ActivityIndicator, TouchableOpacity } from 'react-native';

import { getS3Image } from '../../../../services/S3Service';

import { useSelector } from "react-redux";
import { selectContent } from '../../../../reducers/contentReducer';
import { ImageViewer } from '../../../../component/ImageViewer';
import { useQuery } from "@tanstack/react-query";

export const ImageFactory = ({ config }) => {
  const contentInfos = useSelector(selectContent);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const imgUrl = useQuery({
    queryKey: ['Content', 'GET', "contentImage", config.attributes['src']],
    queryFn: () => getS3Image(contentInfos.s3_path + '/' + contentInfos.title + '/' + config.attributes['src'])
  });

  const getImageWidth = () => {
    if (config.attributes.width) {
      if (config.attributes.width.includes('%')) {
        return config.attributes.width;
      } else {
        return `${config.attributes.width}px`;
      }
    }
    return '100%';
  };

  if (imgUrl.isLoading) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!imgUrl.data || imgUrl.isError || imgError) return null;

  return (
    <View>
      <TouchableOpacity
        onPress={() => setIsFullscreen(true)}
        style={{
          alignSelf: 'center',
          width: getImageWidth(),
          maxWidth: '100%',
          cursor: 'pointer'
        }}
      >
        <img
          src={imgUrl.data}
          alt={config.attributes['alt'] || 'Image'}
          onError={() => setImgError(true)}
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
          url={imgUrl.data} 
          visible={isFullscreen} 
          onClose={() => setIsFullscreen(false)} 
        />
      )}
    </View>
  );
};