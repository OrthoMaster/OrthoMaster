// components/FairPlayVideo.tsx
import React from 'react';
import { Video, ResizeMode } from 'expo-av';
import { StyleSheet, View } from 'react-native';
import { 
  fairplayConfig, 
  validateFairPlayConfig, 
  createFairPlayDRMConfig,
  VideoSourceWithDRM,
  getFairPlayError 
} from '../fairplay/fairplay';

interface FairPlayVideoProps {
  videoUrl: string;
  style?: object;
  resizeMode?: ResizeMode;
}

export const FairPlayVideo: React.FC<FairPlayVideoProps> = ({ 
  videoUrl, 
  style = {},
  resizeMode = ResizeMode.CONTAIN 
}) => {
  // Validate config
  const error = getFairPlayError(fairplayConfig);
  if (error) {
    console.error(error);
    return null;
  }

  const videoSource: VideoSourceWithDRM = {
    uri: videoUrl,
    drm: createFairPlayDRMConfig(),
  };

  return (
    <View style={[styles.container, style]}>
      <Video
        source={videoSource}
        style={styles.video}
        useNativeControls
        resizeMode={resizeMode}
        shouldPlay
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  video: {
    width: '100%',
    height: '100%',
  },
});