/**
 * Image d'un bloc média — version web.
 * Le curseur et le survol signalent que l'image est agrandissable.
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';
import { ImageViewer } from '../../../component/ImageViewer';

type Props = {
  url: string;
  caption?: string;
  width?: number;
};

export const MediaImageBlock = ({ url, caption }: Props) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (!url || hasError) return null;

  return (
    <View>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setIsFullscreen(true)}
        style={{ alignSelf: 'center', width: '100%', cursor: 'pointer' } as any}
      >
        <img
          src={url}
          alt={caption || ''}
          onError={() => setHasError(true)}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            objectFit: 'contain',
          }}
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
    fontSize: 14,
    fontFamily: 'Roboto',
    color: Colors.subtext,
    textAlign: 'center',
  },
});