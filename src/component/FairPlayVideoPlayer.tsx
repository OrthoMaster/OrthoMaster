import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Dimensions,
  Platform
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { VideoView, useVideoPlayer } from 'expo-video';

interface FairPlayVideoPlayerProps {
  url: string;
  type: 'url' | 'hls';
  style?: any;
}

interface VideoStatus {
  isLoaded: boolean;
  isPlaying: boolean;
  positionMillis: number;
  durationMillis: number;
  volume: number;
  rate: number;
  isBuffering: boolean;
  error?: string;
}

const { width: screenWidth } = Dimensions.get('window');
const youtubeVideoHeight = screenWidth * 9 / 16;

const FairPlayVideoPlayer: React.FC<FairPlayVideoPlayerProps> = ({
  url,
  type,
  style,
}) => {

  // Youtube
  if (type === 'url') {
    const videoId = extractYouTubeId(url);
    if (videoId === '') return null;
    
    return (
      <YoutubePlayer
        height={youtubeVideoHeight}
        play={false}
        videoId={videoId}
      />
    );
  }

  // HSL
  return <HLSVideoPlayer url={url} style={style} />;

};

// HSL Video Player
const HLSVideoPlayer: React.FC<{ url: string; style?: any }> = ({ url, style }) => {
  // url = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

  const player = useVideoPlayer({ uri: url, contentType: 'hls' });

  return (
    <VideoView
      style={style || { width: '100%', height: screenWidth * 9 / 16 }}
      player={player}
      allowsPictureInPicture
      contentFit="contain"
      nativeControls
    />
  );
};

// Helper: extract YouTube video ID
function extractYouTubeId(url: string): string {
  try {
    const parsed = new URL(url);

    // Case https://youtu.be/xxxx
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "");
    }

    // Case https://www.youtube.com/embed/xxxx
    if (parsed.pathname.startsWith("/embed/")) {
      return parsed.pathname.split("/embed/")[1];
    }

    // Case https://www.youtube.com/watch?v=xxxx
    if (parsed.searchParams.has("v")) {
      return parsed.searchParams.get("v") as string;
    }

    return "";
  } catch (e) {
    return "";
  }
}

const styles = StyleSheet.create({
});

export default FairPlayVideoPlayer;
