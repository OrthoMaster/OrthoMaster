/**
 * Image d'un bloc média : cliquable, s'ouvre en plein écran.
 * La hauteur est calculée à partir du ratio réel de l'image.
 */
import React, { useState, useEffect } from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet } from 'react-native';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';
import { ImageViewer } from '../../../component/ImageViewer';

type Props = {
  url: string;
  caption?: string;
  width: number;
};

export const MediaImageBlock = ({ url, caption, width }: Props) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [height, setHeight] = useState(0);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!url) {
      setHasError(true);
      return;
    }

    Image.prefetch(url).catch(() => setHasError(true));
  }, [url]);

  if (!url || hasError) return null;

  return (
    <View>
      <TouchableOpacity activeOpacity={0.9} onPress={() => setIsFullscreen(true)}>
        <Image
          source={{ uri: url }}
          resizeMode="contain"
          style={{ alignSelf: 'center', width, height }}
          onLoad={(e) => {
            const { width: w, height: h } = e.nativeEvent.source;
            if (w > 0) setHeight((width * h) / w);
          }}
          onError={() => setHasError(true)}
        />
      </TouchableOpacity>

      {!!caption && <Text style={styles.caption}>{caption}</Text>}

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

export default MediaImageBlock;

const styles = StyleSheet.create({
  caption: {
    marginTop: Spacings.sm,
    marginHorizontal: Spacings.lg,
    fontSize: 13,
    fontFamily: 'Roboto',
    color: Colors.subtext,
    textAlign: 'center',
  },
});