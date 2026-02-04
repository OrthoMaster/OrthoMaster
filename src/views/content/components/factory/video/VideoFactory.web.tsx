import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useQuery } from "@tanstack/react-query";
import { getCdnContentAccessUrl } from '../../../../../services/ContentService';

import Colors from "../../../../../../constants/Colors";
import Spacings from "../../../../../../constants/Spacings";

const SummaryVideoFactory = ({ summary, onSelectChapter }) => {
  return (
    <View style={{ marginTop: Spacings.md }}>
      <Text style={styles.sectionHeaderText}>Accès direct</Text>
      <Text style={styles.sectionSubHeaderText}>Temps forts de la vidéo</Text>
      <View style={{ paddingHorizontal: Spacings.lg, gap: Spacings.sm }}>
        {
          summary.children.map((value, index) => {
            return <TouchableOpacity
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
              key={index}
              onPress={() => onSelectChapter(parseInt(value.attributes.time))}>
              <Text style={styles.chaperText}>• {value.value}</Text>
              <Ionicons name="play-circle-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
          })
        }
      </View>
    </View>
  );
};

const DefaultPlayer = ({ videoUrl, seekTo }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && seekTo > 0) {
      videoRef.current.currentTime = seekTo;
    }
  }, [seekTo]);

  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.load();
    }
  }, [videoUrl]);

  if (!videoUrl) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement de la vidéo...</Text>
      </View>
    );
  }

  return (
    <View style={styles.videoContainer}>
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        controlsList="nodownload"
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#000',
          borderRadius: 8,
        }}
      />
    </View>
  );
};

const YoutubePlayer = ({ videoId, seekTo }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [playerReady, setPlayerReady] = useState(false);

  useEffect(() => {
    if (playerReady && seekTo > 0 && iframeRef.current) {
      const message = JSON.stringify({
        event: 'command',
        func: 'seekTo',
        args: [seekTo, true]
      });
      iframeRef.current.contentWindow?.postMessage(message, '*');
    }
  }, [seekTo, playerReady]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPlayerReady(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{
      width: '100%',
      aspectRatio: '16/9',
      maxHeight: '600px',
      backgroundColor: '#000',
      borderRadius: 8,
      overflow: 'hidden',
      display: 'block',
      marginTop: 10,
      marginBottom: 10
    }}>
      <iframe
        ref={iframeRef}
        src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&modestbranding=1&rel=0`}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="OrthoMaster Video"
      />
    </div>
  );
};

export const VideoFactory = ({ video, contentInfos }) => {
  const videoSummary = video.children.length > 0 && video.children.find(item => item.name === "summary");
  const [videoSeekTo, setVideoSeekTo] = useState(0);
  
  const videoUrl = useQuery({
    queryKey: ['video', video.attributes['src']],
    queryFn: () => getCdnContentAccessUrl(contentInfos.aws_object_path + video.attributes['src']),
    enabled: !!contentInfos.aws_object_path
  });

  return (
    <View style={styles.container}>
      {contentInfos.aws_object_path
        ? <DefaultPlayer videoUrl={videoUrl.data} seekTo={videoSeekTo} />
        : <YoutubePlayer videoId={video.attributes['src']} seekTo={videoSeekTo} />
      }

      {videoSummary &&
        <SummaryVideoFactory
          summary={videoSummary}
          onSelectChapter={(timeCode) => setVideoSeekTo(timeCode)}
        />
      }
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
    maxHeight: 500,
  },
  loadingContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    maxHeight: 500,
  },
  loadingText: {
    color: Colors.white,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
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
  }
});