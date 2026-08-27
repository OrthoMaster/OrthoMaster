import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Audio } from 'expo-av';
import { Svg, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import { addTopic, sendError } from '../../services/v2/AuthService';
import { countTimesPodcast, getPodcastById } from '../../services/v2/ContentService';

import SourceVideoCard from './components/SourceVideoCard';

const WAVEFORM_BARS = 80; // web rộng hơn mobile -> nhiều bar hơn
const BAR_GAP = 2;
const NARROW_BREAKPOINT = 900;
const RIGHT_COLUMN_WIDTH = 360;

export const PodcastPlayerView = ({ navigation, route }) => {
  const { width: winWidth } = useWindowDimensions();
  const isNarrow = winWidth < NARROW_BREAKPOINT;

  const podcastId = route.params?.podcastId ?? null;

  const {
    data,
    isLoading: isLoadingPodcast,
    isError: isErrorPodcast,
    refetch: refetchPodcast,
  } = useQuery({
    queryKey: ['podcast', String(podcastId)],
    queryFn: () => getPodcastById(podcastId),
    enabled: !!podcastId,
    retry: 2,
    retryDelay: 2000,
  });

  const podcast = data?.podcast ?? null;
  const hasTopic = !!data?.has_topic;

  const audioUrl = podcast?.link ?? null;
  const thumbnailUrl = podcast?.image ?? null;
  const title = podcast?.title ?? '';
  const subtitle = podcast?.author ?? '';
  const topic = podcast?.topic ?? null;
  const video = podcast?.content ?? null;

  const queryClient = useQueryClient();

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [hasFinished, setHasFinished] = useState(false);
  const [subscribed, setSubscribed] = useState<boolean>(hasTopic);
  const [liked, setLiked] = useState<boolean>(!!data?.has_like);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Toast animation
  const toastTranslateY = useRef(new Animated.Value(-100)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;

  /* ---------------- Waveform seek ---------------- */
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekRatio, setSeekRatio] = useState(0);
  const [waveWidth, setWaveWidth] = useState(600);

  const waveRef = useRef<View>(null);
  const waveLeftRef = useRef(0);
  const waveWidthRef = useRef(600);
  const durationRef = useRef(0);
  const isSeekingRef = useRef(false);

  const handleWaveLayout = () => {
    waveRef.current?.measureInWindow((x, _y, w) => {
      waveLeftRef.current = x;
      if (w > 0) {
        waveWidthRef.current = w;
        setWaveWidth(w);
      }
    });
  };

  // Trên web, resize cửa sổ làm lệch toạ độ đã đo -> đo lại
  useEffect(() => {
    handleWaveLayout();
  }, [winWidth]);

  const ratioFromPageX = (pageX: number) => {
    const w = waveWidthRef.current || 1;
    return Math.max(0, Math.min(1, (pageX - waveLeftRef.current) / w));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        isSeekingRef.current = true;
        setIsSeeking(true);
        setSeekRatio(ratioFromPageX(evt.nativeEvent.pageX));
      },
      onPanResponderMove: (evt) => {
        setSeekRatio(ratioFromPageX(evt.nativeEvent.pageX));
      },
      onPanResponderRelease: async (evt) => {
        const ratio = ratioFromPageX(evt.nativeEvent.pageX);
        const total = durationRef.current;

        if (soundRef.current && total > 0) {
          try {
            await soundRef.current.setPositionAsync(Math.round(ratio * total));
            setPosition(Math.round(ratio * total));
            setHasFinished(false);
          } catch (error) {
            sendError('podcast-player-view-web', error);
          }
        }

        isSeekingRef.current = false;
        setIsSeeking(false);
      },
      onPanResponderTerminate: () => {
        isSeekingRef.current = false;
        setIsSeeking(false);
      },
    })
  ).current;

  /* ---------------- Data effects ---------------- */

  useEffect(() => {
    setSubscribed(hasTopic);
  }, [hasTopic]);

  useEffect(() => {
    setLiked(!!data?.has_like);
  }, [data?.has_like]);

  useEffect(() => {
    const bars = Array.from({ length: WAVEFORM_BARS }, (_, i) => {
      const baseHeight = 15 + Math.sin(i * 0.3) * 10;
      const randomness = Math.random() * 15;
      return Math.max(8, Math.min(45, baseHeight + randomness));
    });
    setWaveformData(bars);
  }, []);

  const countedRef = useRef(false);
  useEffect(() => {
    if (!podcast?.id || countedRef.current) return;
    countedRef.current = true;
    countTimesPodcast(podcast.id);
  }, [podcast?.id]);

  useEffect(() => {
    if (!toastMessage) return;

    toastTranslateY.setValue(-100);
    toastOpacity.setValue(0);

    Animated.parallel([
      Animated.spring(toastTranslateY, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastTranslateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setToastMessage(null));
    }, 3000);

    return () => clearTimeout(timeout);
  }, [toastMessage]);

  const onPlaybackStatusUpdate = (status: any) => {
    if (!status.isLoaded) return;

    durationRef.current = status.durationMillis ?? 0;
    setDuration(status.durationMillis);
    setIsPlaying(status.isPlaying);

    if (!isSeekingRef.current) {
      setPosition(status.positionMillis);
    }

    if (status.didJustFinish) {
      setIsPlaying(false);
      setHasFinished(true);
    }
  };

  /**
   * Web: KHÔNG gọi Audio.setAudioModeAsync — expo-av không hỗ trợ trên web
   * (playsInSilentModeIOS / staysActiveInBackground là API của native).
   */
  useEffect(() => {
    if (!audioUrl) return;

    let isActive = true;
    let createdSound: Audio.Sound | null = null;

    const loadAudio = async () => {
      try {
        setIsLoadingAudio(true);

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: false },
          onPlaybackStatusUpdate
        );

        if (!isActive) {
          await newSound.unloadAsync();
          return;
        }

        createdSound = newSound;
        soundRef.current = newSound;
        setSound(newSound);
      } catch (error) {
        sendError('podcast-player-view-web', error);
      } finally {
        if (isActive) setIsLoadingAudio(false);
      }
    };

    loadAudio();

    return () => {
      isActive = false;
      soundRef.current = null;
      createdSound?.unloadAsync();
    };
  }, [audioUrl]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        soundRef.current?.pauseAsync().catch(() => { });
      };
    }, [])
  );

  /* ---------------- Controls ---------------- */

  const togglePlayPause = async () => {
    if (!sound) return;

    try {
      if (hasFinished) {
        await sound.setPositionAsync(0);
        await sound.playAsync();
        setHasFinished(false);
        setIsPlaying(true);
      } else if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (error) {
      sendError('podcast-player-view-web', error);
    }
  };

  const skipForward = async () => {
    if (!sound) return;
    await sound.setPositionAsync(Math.min(position + 15000, duration));
  };

  const skipBackward = async () => {
    if (!sound) return;
    await sound.setPositionAsync(Math.max(position - 15000, 0));
  };

  const handleClose = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('home');
  };

  /* ---------------- Actions ---------------- */

  /** Web: partage natif si disponible, sinon copie du lien */
  const handleShare = async () => {
    if (!podcast) return;

    const contentId = podcast.id;
    const link = `https://go.orthomaster.fr/open/podcast/${contentId}`;
    const message =
      "Voici un contenu intéressant à écouter sur OrthoMaster :\n\n" +
      title +
      (subtitle ? ` par ${subtitle}` : '') +
      "\n\n" +
      link;

    try {
      if (navigator.share) {
        await navigator.share({ title, text: message, url: link });
        return;
      }

      await navigator.clipboard.writeText(link);
      setToastMessage('Lien copié dans le presse-papiers');
    } catch (error) {
      // L'utilisateur a annulé le partage natif: rien à signaler
    }
  };

  const handleSubscribeTopic = async () => {
    if (!topic || subscribed) return;

    setSubscribed(true);
    setToastMessage(`Vous suivez le sujet ${topic.name}`);

    try {
      await addTopic(topic.id);
      await queryClient.invalidateQueries({ queryKey: ['current-user'] });
      await queryClient.invalidateQueries({ queryKey: ['daily-action'] });
    } catch (error) {
      setSubscribed(false);
      sendError('podcast-player-view-web', error);
    }
  };

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);

    try {
      // TODO: brancher l'API ici, ex: await likePodcast(podcast.id, next)
    } catch (error) {
      setLiked(!next);
      sendError('podcast-player-view-web', error);
    }
  };

  const handleOpenSourceVideo = () => {
    if (!video?.id_content) return;
    navigation.navigate('media', {
      screen: 'flash-media-preview',
      params: { media: video },
    });
  };

  const formatTime = (millis: number) => {
    if (!millis) return '0:00';
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const playedRatio = duration > 0 ? position / duration : 0;
  const displayRatio = isSeeking ? seekRatio : playedRatio;
  const displayPosition = isSeeking ? seekRatio * duration : position;

  /* ---------------- States ---------------- */

  if (isLoadingPodcast) {
    return (
      <View style={styles.centeredScreen}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!podcast) {
    return (
      <View style={styles.centeredScreen}>
        <TouchableOpacity onPress={handleClose} style={[styles.iconButton, styles.closeFloating]}>
          <Ionicons name="close" size={24} color={Colors.white} />
        </TouchableOpacity>

        <Ionicons name="mic-off-outline" size={70} color={Colors.subtext2} />
        <Text style={styles.emptyText}>Ce podcast n'est plus disponible.</Text>
        {isErrorPodcast && (
          <TouchableOpacity onPress={() => refetchPodcast()} style={styles.retryButton}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const renderAction = (
    key: string,
    icon: any,
    label: string,
    onPress: () => void,
    active = false
  ) => (
    <TouchableOpacity
      key={key}
      onPress={onPress}
      style={[styles.actionButton, active && styles.actionButtonActive]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={18} color={active ? Colors.primary : Colors.white} />
      <Text
        style={[styles.actionLabel, active && styles.actionLabelActive]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      {/* Thumbnail full màn hình */}
      {thumbnailUrl ? (
        <Image
          source={{ uri: thumbnailUrl }}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.backgroundImage, styles.backgroundPlaceholder]}>
          <Ionicons name="mic" size={140} color={Colors.subtext2} />
        </View>
      )}

      {/* Gradient để chữ ở bottom bar luôn đọc được */}
      <LinearGradient
        colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.85)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject as any}
        pointerEvents="none"
      />

      {/* Toast */}
      {!!toastMessage && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              transform: [{ translateY: toastTranslateY }],
              opacity: toastOpacity,
            },
          ]}
        >
          <Ionicons name="notifications" size={20} color={Colors.primary} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}

      {/* Close - góc trên trái */}
      <TouchableOpacity onPress={handleClose} style={[styles.iconButton, styles.closeFloating]}>
        <Ionicons name="close" size={24} color={Colors.white} />
      </TouchableOpacity>

      <View style={styles.bottomSection}>
        {/* Khối thông tin - nằm NGOÀI bottom bar, canh trái */}
        <View style={styles.infoWrapper}>
          <View style={styles.infoBlock}>
            {topic && (
              <View style={styles.topicBadge}>
                <Text style={styles.topicText}>{topic.name}</Text>
              </View>
            )}

            <Text style={styles.title} numberOfLines={2}>{title}</Text>

            {!!subtitle && (
              <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
            )}
          </View>
        </View>

        {/* Bottom bar: 2 cột */}
        <View style={styles.bottomBar}>
          <View style={[styles.bottomInner, isNarrow && styles.bottomInnerNarrow]}>
            {/* Cột trái: waveform + controls */}
            <View style={styles.playerColumn}>
              <View style={styles.waveRow}>
                <Text style={styles.time}>{formatTime(displayPosition)}</Text>

                <View
                  ref={waveRef}
                  onLayout={handleWaveLayout}
                  {...panResponder.panHandlers}
                  style={styles.waveformContainer}
                >
                  {isLoadingAudio ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <Svg height="44" width="100%">
                      {waveformData.map((barHeight, index) => {
                        const barProgress = index / WAVEFORM_BARS;
                        const isActive = barProgress <= displayRatio;
                        const barWidth = Math.max(2, waveWidth / WAVEFORM_BARS - BAR_GAP);

                        return (
                          <Rect
                            key={index}
                            x={index * (barWidth + BAR_GAP)}
                            y={(44 - barHeight) / 2}
                            width={barWidth}
                            height={Math.min(barHeight, 44)}
                            fill={isActive ? Colors.primary : 'rgba(255,255,255,0.25)'}
                            rx={barWidth / 2}
                          />
                        );
                      })}
                    </Svg>
                  )}
                </View>

                <Text style={styles.time}>{formatTime(duration)}</Text>
              </View>

              <View style={styles.controls}>
                <TouchableOpacity
                  onPress={skipBackward}
                  disabled={!sound || isLoadingAudio}
                  style={styles.controlButton}
                >
                  <Ionicons name="play-back" size={24} color={Colors.white} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.playButton, !isPlaying && { paddingLeft: 4 }]}
                  onPress={togglePlayPause}
                  disabled={!sound || isLoadingAudio}
                >
                  {isLoadingAudio ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <Ionicons
                      name={hasFinished ? 'reload' : isPlaying ? 'pause' : 'play'}
                      size={28}
                      color={Colors.primary}
                    />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={skipForward}
                  disabled={!sound || isLoadingAudio}
                  style={styles.controlButton}
                >
                  <Ionicons name="play-forward" size={24} color={Colors.white} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Cột phải: SourceVideoCard trên, actions dưới */}
            <View style={[styles.sideColumn, isNarrow && styles.sideColumnNarrow]}>
              <SourceVideoCard video={video} onPress={handleOpenSourceVideo} />

              <View style={styles.actionsGroup}>
                {renderAction('share', 'share-social-outline', 'Partager', handleShare)}

                {!!topic &&
                  renderAction(
                    'follow',
                    subscribed ? 'notifications' : 'notifications-outline',
                    'Suivre',
                    handleSubscribeTopic,
                    subscribed
                  )}

                {renderAction(
                  'like',
                  liked ? 'heart' : 'heart-outline',
                  "J'aime",
                  handleLike,
                  liked
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.blackBackground,
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  backgroundPlaceholder: {
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },

  centeredScreen: {
    flex: 1,
    backgroundColor: Colors.blackBackground,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacings.md,
  },
  emptyText: {
    color: Colors.subtext2,
    fontSize: 18,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacings.sm,
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
    cursor: 'pointer',
  } as any,
  retryText: {
    color: Colors.primary,
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
  },

  closeFloating: {
    position: 'absolute',
    top: Spacings.lg,
    left: Spacings.lg,
    zIndex: 20,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    cursor: 'pointer',
  } as any,

  toastContainer: {
    position: 'absolute',
    top: Spacings.lg,
    alignSelf: 'center',
    maxWidth: 420,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 12,
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    zIndex: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  toastText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    flex: 1,
  },

  /* ---- Bottom section (info + bar) ---- */
  bottomSection: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  infoWrapper: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    paddingHorizontal: Spacings.lg,
    paddingBottom: Spacings.md,
  },
  infoBlock: {
    maxWidth: 640,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 42,
    lineHeight: 48,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 22,
    fontFamily: 'Poppins-Regular',
    color: Colors.grayLight,
    marginTop: Spacings.xxs,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  topicBadge: {
    alignSelf: 'flex-start',
    marginBottom: Spacings.sm,
    paddingHorizontal: Spacings.md,
    paddingVertical: Spacings.xxs,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  topicText: {
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    color: Colors.primary,
    letterSpacing: 0.3,
  },

  /* ---- Bottom bar ---- */
  bottomBar: {
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.lg,
    backdropFilter: 'blur(12px)',
  } as any,
  bottomInner: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xl,
  },
  bottomInnerNarrow: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: Spacings.md,
  },

  /* Cột trái: waveform + controls */
  playerColumn: {
    flex: 1,
    minWidth: 0,
    gap: Spacings.xs,
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
  },
  waveformContainer: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    cursor: 'pointer',
  } as any,
  time: {
    color: Colors.grayLight,
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    width: 42,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.lg,
  },
  controlButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacings.xxs,
    cursor: 'pointer',
  } as any,
  playButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    cursor: 'pointer',
  } as any,

  /* Cột phải: SourceVideoCard + actions */
  sideColumn: {
    width: RIGHT_COLUMN_WIDTH,
  },
  sideColumnNarrow: {
    width: '100%',
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  actionButton: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.xxs,
    paddingHorizontal: Spacings.sm,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    cursor: 'pointer',
  } as any,
  actionButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  actionLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
  actionLabelActive: {
    color: Colors.primary,
  },
});

export default PodcastPlayerView;