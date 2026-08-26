import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Animated,
  PanResponder
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, CommonActions } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Audio } from 'expo-av';
import { Svg, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import { addTopic, sendError } from '../../services/v2/AuthService';
import { countTimesPodcast, getPodcastById } from '../../services/v2/ContentService';

const { width } = Dimensions.get('window');
const WAVEFORM_BARS = 50;

export const PodcastPlayerView = ({ navigation, route }) => {
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

  const queryClient = useQueryClient();

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);
  const [subscribed, setSubscribed] = useState<boolean>(hasTopic);

  // Toast animation values
  const toastTranslateY = useRef(new Animated.Value(-100)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;

  // Control waveform
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekRatio, setSeekRatio] = useState(0);
  const [waveWidth, setWaveWidth] = useState(width - Spacings.lg * 2);

  const waveRef = useRef<View>(null);
  const waveLeftRef = useRef(0);
  const waveWidthRef = useRef(width - Spacings.lg * 2);
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
            sendError('podcast-player-view', error);
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

  // Control nav
  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      parent?.setOptions({ tabBarStyle: { display: 'none' } });

      return () => {
        parent?.setOptions({ tabBarStyle: undefined });
      };
    }, [navigation])
  );

  // Đồng bộ lại state subscribe khi data về từ API (case deeplink)
  useEffect(() => {
    setSubscribed(hasTopic);
  }, [hasTopic]);

  /** Waveform giả lập */
  useEffect(() => {
    const data = Array.from({ length: WAVEFORM_BARS }, (_, i) => {
      const baseHeight = 15 + Math.sin(i * 0.3) * 10;
      const randomness = Math.random() * 15;
      return Math.max(8, Math.min(45, baseHeight + randomness));
    });
    setWaveformData(data);
  }, []);

  /** Đếm lượt nghe - chạy 1 lần khi đã biết id (kể cả vào từ deeplink) */
  const countedRef = useRef(false);
  useEffect(() => {
    if (!podcast?.id || countedRef.current) return;
    countedRef.current = true;
    countTimesPodcast(podcast.id);
  }, [podcast?.id]);

  /** Toast animation */
  useEffect(() => {
    if (!showToast) return;

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
      ]).start(() => setShowToast(false));
    }, 3000);

    return () => clearTimeout(timeout);
  }, [showToast]);

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

  /** Load audio khi có url. Unload khi rời screen (unmount) */
  useEffect(() => {
    if (!audioUrl) return;

    let isActive = true;
    let createdSound: Audio.Sound | null = null;

    const loadAudio = async () => {
      try {
        setIsLoadingAudio(true);

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: false },
          onPlaybackStatusUpdate
        );

        // Screen đã bị unmount trong lúc đang load
        if (!isActive) {
          await newSound.unloadAsync();
          return;
        }

        createdSound = newSound;
        soundRef.current = newSound;
        setSound(newSound);
      } catch (error) {
        sendError('podcast-player-view', error);
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

  /** Pause khi screen mất focus (mở screen khác, back...) */
  useFocusEffect(
    useCallback(() => {
      return () => {
        soundRef.current?.pauseAsync().catch(() => { });
      };
    }, [])
  );

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
      sendError('podcast-player-view', error);
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

  const playedRatio = duration > 0 ? position / duration : 0;
  const displayRatio = isSeeking ? seekRatio : playedRatio;
  const displayPosition = isSeeking ? seekRatio * duration : position;

  /**
   * Deeplink: stack có thể rỗng -> goBack() sẽ thoát app.
   * Fallback về home cho chắc.
   */
  const handleClose = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'home' }],
      })
    );
  };

  const handleSubscribeTopic = async () => {
    toastTranslateY.setValue(-100);
    toastOpacity.setValue(0);
    setShowToast(true);

    if (topic && !subscribed) {
      setSubscribed(true);
      await addTopic(topic.id);
      await queryClient.invalidateQueries({ queryKey: ['current-user'] });
      await queryClient.invalidateQueries({ queryKey: ['daily-action'] });
    }
  };

  const formatTime = (millis: number) => {
    if (!millis) return '0:00';
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? position / duration : 0;

  /** State: đang tải podcast từ deeplink */
  if (isLoadingPodcast) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.blackBackground} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  /** State: không tải được podcast */
  if (!podcast) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.blackBackground} />
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={[styles.iconButton, { marginLeft: 32, marginTop: 8 }]}>
            <Ionicons name="close" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Ionicons name="mic-off-outline" size={70} color={Colors.subtext2} />
          <Text style={styles.emptyText}>Ce podcast n'est plus disponible.</Text>
          {isErrorPodcast && (
            <TouchableOpacity onPress={() => refetchPodcast()} style={styles.retryButton}>
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.blackBackground} />

      <View style={styles.container}>
        {/* Toast Notification */}
        {showToast && (
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
            <Text style={styles.toastText}>Vous suivez le sujet {topic?.name}</Text>
          </Animated.View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.iconButton}>
            <Ionicons name="close" size={22} color={Colors.white} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSubscribeTopic} style={styles.iconButton}>
            {subscribed
              ? <Ionicons name="heart" size={20} color={Colors.primary} />
              : <Ionicons name="heart-outline" size={20} color={Colors.white} />
            }
          </TouchableOpacity>
        </View>

        {/* Thumbnail */}
        <View style={styles.thumbnailContainer}>
          {thumbnailUrl ? (
            <Image
              source={{ uri: thumbnailUrl }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.iconPlaceholder}>
              <Ionicons name="mic" size={80} color={Colors.subtext2} />
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>{title}</Text>

        {/* Subtitle */}
        {!!subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
        )}

        {/* Topic Badge */}
        {topic && (
          <View style={styles.topicContainer}>
            <View style={styles.topicBadge}>
              <Text style={styles.topicText}>{topic.name}</Text>
            </View>
          </View>
        )}

        {/* Waveform */}
        <View
          ref={waveRef}
          onLayout={handleWaveLayout}
          {...panResponder.panHandlers}
          style={styles.waveformContainer}
        >
          {isLoadingAudio ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Svg height="60" width="100%">
              {waveformData.map((barHeight, index) => {
                const barProgress = index / WAVEFORM_BARS;
                const isActive = barProgress <= displayRatio;
                const barWidth = waveWidth / WAVEFORM_BARS - 2;

                return (
                  <Rect
                    key={index}
                    x={index * (barWidth + 2)}
                    y={(60 - barHeight) / 2}
                    width={barWidth}
                    height={barHeight}
                    fill={isActive ? Colors.primary : '#333'}
                    rx={barWidth / 2}
                  />
                );
              })}
            </Svg>
          )}
        </View>

        {/* Time */}
        <View style={styles.timeContainer}>
          <Text style={styles.time}>{formatTime(displayPosition)}</Text>
          <Text style={styles.time}>{formatTime(duration)}</Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={skipBackward}
            disabled={!sound || isLoadingAudio}
            style={styles.controlButton}
          >
            <Ionicons name="play-back" size={28} color={Colors.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.playButton, !isPlaying && { paddingLeft: 5 }]}
            onPress={togglePlayPause}
            disabled={!sound || isLoadingAudio}
          >
            {isLoadingAudio ? (
              <ActivityIndicator size="large" color={Colors.primary} />
            ) : (
              <Ionicons
                name={hasFinished ? 'reload' : isPlaying ? 'pause' : 'play'}
                size={40}
                color={Colors.primary}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={skipForward}
            disabled={!sound || isLoadingAudio}
            style={styles.controlButton}
          >
            <Ionicons name="play-forward" size={28} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.blackBackground,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.blackBackground,
    paddingHorizontal: Spacings.lg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacings.md,
    marginBottom: 150,
  },
  emptyText: {
    color: Colors.subtext2,
    fontSize: 18,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    paddingHorizontal: Spacings.xl,
  },
  retryButton: {
    marginTop: Spacings.sm,
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  retryText: {
    color: Colors.primary,
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
  },
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: Spacings.lg,
    right: Spacings.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  toastText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: Spacings.xxl,
  },
  closeButton: {
    padding: 8,
  },
  moreButton: {
    padding: 8,
  },
  thumbnailContainer: {
    alignItems: 'center',
    marginBottom: Spacings.xl,
  },
  thumbnail: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: 16,
  },
  iconPlaceholder: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacings.xxs,
    paddingHorizontal: Spacings.lg,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: Colors.subtext2,
    textAlign: 'center',
    marginBottom: Spacings.md,
  },
  topicContainer: {
    alignItems: 'center',
    marginBottom: Spacings.lg,
  },
  topicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacings.md,
    paddingVertical: Spacings.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  topicText: {
    fontSize: 15,
    fontFamily: 'Roboto',
    fontWeight: '500',
    color: Colors.primary,
    letterSpacing: 0.4,
  },
  waveformContainer: {
    height: 60,
    justifyContent: 'center',
    marginBottom: Spacings.md,
    paddingVertical: Spacings.sm,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacings.xxs,
    marginBottom: Spacings.lg,
  },
  time: {
    color: Colors.gray,
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacings.xxl,
    flex: 1,
    paddingBottom: Spacings.xxxl,
  },
  controlButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
});

export default PodcastPlayerView;