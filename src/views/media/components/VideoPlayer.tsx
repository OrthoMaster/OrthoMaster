// VideoPlayer.tsx (Mobile - Native Controls Only, No Fullscreen Highlights)
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import Colors from "../../../../constants/Colors";

import { fetchVideoAccess } from '../../../services/v2/ContentService';

// ─── Types & Constants ────────────────────────────────────────────────────────

type SubtitleTrack = {
  language: string;
  label: string;
  url: string;
};

type VideoData = {
  title: string;
  url: string;
  highlights: { id: number; time: number; label: string }[];
  subtitles: SubtitleTrack[];
};

export type VideoPlayerProps = {
  videoCode?: string;
  navigation?: any;
  embedWidth?: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(s: number) {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ─── EmbeddedSommaire ─────────────────────────────────────────────────────────

const EmbeddedSommaire = ({
  highlights,
  currentTime,
  duration,
  onSeek,
}: {
  highlights: VideoData['highlights'];
  currentTime: number;
  duration: number;
  onSeek: (t: number) => void;
}) => {
  if (highlights.length === 0) return null;

  return (
    <View style={sommaireStyles.wrapper}>
      <View style={sommaireStyles.header}>
        <Ionicons name="list" size={12} color="rgba(255,255,255,0.3)" />
        <Text style={sommaireStyles.headerLabel}>SOMMAIRE</Text>
      </View>

      {highlights.map((h, i) => {
        const isActive =
          currentTime >= h.time &&
          (i === highlights.length - 1 || currentTime < highlights[i + 1].time);
        const isPassed = !isActive && currentTime > h.time;

        return (
          <TouchableOpacity
            key={h.id}
            style={[sommaireStyles.row, isActive && sommaireStyles.rowActive]}
            onPress={() => onSeek(h.time)}
            activeOpacity={0.6}
          >
            <View style={[sommaireStyles.accentBar, isActive && sommaireStyles.accentBarActive]} />

            <View style={[
              sommaireStyles.indexBubble,
              isPassed && sommaireStyles.indexBubblePassed,
              isActive && sommaireStyles.indexBubbleActive,
            ]}>
              {isPassed && !isActive ? (
                <Ionicons name="checkmark" size={9} color="#fff" />
              ) : (
                <Text style={[
                  sommaireStyles.indexText,
                  (isPassed || isActive) && sommaireStyles.indexTextLight,
                ]}>
                  {i + 1}
                </Text>
              )}
            </View>

            <View style={sommaireStyles.rowBody}>
              <Text style={sommaireStyles.rowTime}>{formatTime(h.time)}</Text>
              <Text
                style={[sommaireStyles.rowLabel, isActive && sommaireStyles.rowLabelActive]}
                numberOfLines={2}
              >
                {h.label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ─── CorePlayer ───────────────────────────────────────────────────────────────

type CorePlayerProps = {
  player: any;
};

const CorePlayer = ({ player }: CorePlayerProps) => {
  return (
    <View style={styles.playerRoot}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        nativeControls={true}
        contentFit="contain"
        allowsPictureInPicture={true}
      />
    </View>
  );
};

// ─── VideoPlayerReady ─────────────────────────────────────────────────────────

type VideoPlayerReadyProps = {
  videoData: VideoData;
  embedWidth: number;
  embedHeight: number;
};

const VideoPlayerReady = ({ videoData, embedWidth, embedHeight }: VideoPlayerReadyProps) => {
  const player = useVideoPlayer(videoData.url, p => {
    // p.play();
  });

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Detect landscape orientation
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const isLandscape = dimensions.width > dimensions.height;

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentTime(player.currentTime ?? 0);
      setDuration(player.duration ?? 0);
    }, 300);
    return () => clearInterval(id);
  }, [player]);

  return (
    <View>
      <View style={{ width: embedWidth, height: embedHeight, backgroundColor: Colors.blackBackground, overflow: 'hidden' }}>
        <CorePlayer player={player} />
      </View>

      {/* Embedded Sommaire - Only show in portrait (not fullscreen) */}
      {!isLandscape && videoData.highlights.length > 0 && (
        <EmbeddedSommaire
          highlights={videoData.highlights}
          currentTime={currentTime}
          duration={duration}
          onSeek={t => { player.currentTime = t; player.play(); }}
        />
      )}
    </View>
  );
};

// ─── VideoPlayer ──────────────────────────────────────────────────────────────

export const VideoPlayer = ({ videoCode, navigation, embedWidth }: VideoPlayerProps) => {
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);

  const resolvedCode = videoCode;
  const width = embedWidth ?? Dimensions.get('window').width;
  const height = Math.round(width * 9 / 16);

  useEffect(() => {
    fetchVideoAccess(resolvedCode).then(data => {
      setVideoData(data);
      setLoading(false);
    }).catch(err => {
      setLoading(false);
    });
  }, [resolvedCode]);

  if (loading || !videoData) {
    return (
      <View style={{ width, height, backgroundColor: Colors.blackBackground, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#E50914" />
        {loading && <Text style={{ color: '#fff', marginTop: 10, fontSize: 12 }}>Chargement...</Text>}
      </View>
    );
  }

  return (
    <VideoPlayerReady
      videoData={videoData}
      embedWidth={width}
      embedHeight={height}
    />
  );
};

// ─── Sommaire Styles ──────────────────────────────────────────────────────────

const sommaireStyles = StyleSheet.create({
  wrapper: {
    marginTop: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(10, 10, 14, 0.9)'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerLabel: {
    color: 'rgba(255,255,255,0.28)',
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingRight: 16,
    paddingLeft: 12,
    gap: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    marginBottom: 2,
    overflow: 'hidden',
  },
  rowActive: {
    backgroundColor: 'rgba(229,9,20,0.07)',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 2.5,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  accentBarActive: {
    backgroundColor: '#E50914',
  },
  indexBubble: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  indexBubblePassed: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.25)',
  },
  indexBubbleActive: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  indexText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 9,
    fontFamily: 'Poppins-Medium',
  },
  indexTextLight: {
    color: '#fff',
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    lineHeight: 18,
  },
  rowLabelActive: {
    color: '#fff',
    fontFamily: 'Poppins-Medium',
  },
  rowTime: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
  },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  playerRoot: { flex: 1, backgroundColor: Colors.blackBackground },
});