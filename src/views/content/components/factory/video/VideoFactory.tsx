import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Text
} from 'react-native';

import YoutubePlayer from "react-native-youtube-iframe";
import { VideoControls } from './VideoControls';
import { VideoFullScreenModal } from './VideoFullScreenModal';
import { Ionicons } from '@expo/vector-icons';

import { useVideoPlayer, VideoView } from 'expo-video';

import { useQuery } from "@tanstack/react-query";
import { getCdnContentAccessUrl } from '../../../../../services/ContentService';

import Colors from "../../../../../../constants/Colors";
import Spacings from "../../../../../../constants/Spacings";

const SummaryVideoFactory = ({ summary, onSelectChapter }) => {
  return (
    <View style={{ marginTop: Spacings.md }}>
      <Text style={styles.sectionHeaderText}>Accès direct</Text>
      <Text style={styles.sectionSubHeaderText}>Temps forts de la vidéo </Text>
      <View style={{ paddingHorizontal: Spacings.md, gap: Spacings.sm }}>
        {
          summary.children.map((value, index) => {
            return <TouchableOpacity
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
              key={index}
              onPress={() => onSelectChapter(parseInt(value.attributes.time))}>
              <Text style={styles.chaperText} numberOfLines={3}>• {value.value}</Text>
              <Ionicons name="play-circle-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
          })
        }
      </View>
    </View>
  )
}

const DefaultPlayer = ({ videoUrl, seekTo }) => {
  const player = useVideoPlayer(videoUrl, player => {
    player.loop = true;
    // player.play();
  });

  useEffect(() => {
    player.currentTime = seekTo
  }, [seekTo])

  return <VideoView
    style={{ flex: 1, height: Dimensions.get('screen').width * 9 / 16 }}
    contentFit="contain"
    player={player}
    nativeControls={true}
    allowsFullscreen={true}
    allowsPictureInPicture
  />
}

const MyYoutubePlayer = ({ videoId, seekTo }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const playerRef = useRef(null)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [key, setKey] = useState(0); // Ajoutez une clé unique pour le rechargement

  const jumpTime = async (time) => {
    playerRef.current.seekTo(await playerRef.current.getCurrentTime() + time)
  }

  const togglePlaying = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  useEffect(() => {
    setKey((prev) => prev + 1);

  }, [])

  useEffect(() => {
    playerRef.current.seekTo(seekTo)
  }, [seekTo])

  return <Pressable
    style={styles.container}
    onPress={() => {
      setIsPlaying(!isPlaying);
    }}>
    <View pointerEvents={'none'}>
      <YoutubePlayer
        key={key}
        webViewProps={{
          androidLayerType: 'none',
          androidHardwareAccelerationDisabled: false
        }}
        ref={playerRef}
        height={Dimensions.get('screen').width * 9 / 16}
        videoId={videoId}
        initialPlayerParams={{
          modestbranding: 1,
          controls: 0,
        }}
        play={isPlaying}
        onChangeState={event => {
          if (event === 'paused') {
            setIsPlaying(false);
          }
        }}
      />
    </View>
    <VideoControls
      running={isPlaying}
      theme={'dark'}
      onPlay={togglePlaying}
      onJumpBefore={() => {
        jumpTime(-10)
      }}
      onJumpAfter={() => {
        jumpTime(10)
      }}
      onFullScreen={async () => {
        setIsFullScreen(true)
      }}
      style={{}}
    />

    {isFullScreen &&
      <VideoFullScreenModal
        videoUrl={videoId}
        isVisible={isFullScreen}
        videoRef={playerRef}
        onClose={() => setIsFullScreen(false)}
        isRunning={isPlaying}
      />
    }
  </Pressable>
}

export const VideoFactory = ({ video, contentInfos }) => {
  const videoSummary = video.children.length > 0 && video.children.find(item => item.name === "summary")
  const [videoSeekTo, setVideoSeekTo] = useState(0)
  const videoUrl = useQuery({
    queryKey: ['video', video.attributes['src']],
    queryFn: () => getCdnContentAccessUrl(contentInfos.aws_object_path + video.attributes['src']),
    enabled: contentInfos.aws_object_path !== null
  })

  return <View style={{}}>
    {contentInfos.aws_object_path
      ? <DefaultPlayer videoUrl={videoUrl.data} seekTo={videoSeekTo} />
      : <MyYoutubePlayer videoId={video.attributes['src']} seekTo={videoSeekTo} />
    }

    {videoSummary &&
      <SummaryVideoFactory
        summary={videoSummary}
        onSelectChapter={(timeCode) => setVideoSeekTo(timeCode)}
      />
    }
  </View>


}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeaderText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: Colors.white,
    backgroundColor: Colors.primary,
    flex: 1,
    paddingVertical: Spacings.xs,
    paddingHorizontal: Spacings.md,
    marginTop: Spacings.md
  },
  sectionSubHeaderText: {
    color: Colors.primary,
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    lineHeight: 20,
    marginVertical: Spacings.sm,
    paddingHorizontal: Spacings.md
  },
  chaperText: {
    fontSize: 14,
    fontFamily: 'Roboto',
    fontWeight: '400',
    flex: 1,
    flexWrap: 'wrap',
    marginRight: 2,
  },
})
