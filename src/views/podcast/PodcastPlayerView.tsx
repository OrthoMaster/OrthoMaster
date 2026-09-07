import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Animated,
  PanResponder
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, CommonActions } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Audio } from 'expo-av';
import { Svg, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { orthomasterShare } from '../../futils';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import SourceVideoCard from './components/SourceVideoCard';

import { sendError } from '../../services/v2/AuthService';
import { toggleTopic, toggleFavourite } from '../../services/v2/FavouriteService';
import { countTimesPodcast, getPodcastById } from '../../services/v2/ContentService';
import useDebouncedToggle from '../../hooks/useDebouncedToggle';

import useTopicFollowPrompt from '../../hooks/useTopicFollowPrompt';
import TopicFollowDialog from '../../component/TopicFollowDialog';

const { width, height } = Dimensions.get('window');
const WAVEFORM_BARS = 50;
const WAVEFORM_HEIGHT = 52;

/** Ảnh tràn từ mép trên. Giới hạn theo chiều cao để máy thấp vẫn đủ chỗ */
const IMAGE_HEIGHT = Math.min(width * 0.9, height * 0.35);

/** Chừa chỗ cho thanh action cố định ở đáy */
const BOTTOM_BAR_SPACE = 100;

/** Bề ngang thật của waveform: trừ padding của screen và của group */
const WAVE_INITIAL_WIDTH = width - Spacings.lg * 2 - Spacings.md * 2;

export const PodcastPlayerView = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hasFinished, setHasFinished] = useState(false);

  // Toast animation values
  const toastTranslateY = useRef(new Animated.Value(-100)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;

  // Control waveform
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekRatio, setSeekRatio] = useState(0);
  const [waveWidth, setWaveWidth] = useState(WAVE_INITIAL_WIDTH);

  const waveRef = useRef<View>(null);
  const waveLeftRef = useRef(0);
  const waveWidthRef = useRef(WAVE_INITIAL_WIDTH);
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

  /* ---------------- Suivi du sujet et favori ---------------- */

  const [subscribed, toggleSubscribed] = useDebouncedToggle(
    hasTopic,
    async () => {
      if (!topic) return false;

      const ok = await toggleTopic(topic.id);

      if (ok) {
        await queryClient.invalidateQueries({ queryKey: ['current-user'] });
        await queryClient.invalidateQueries({ queryKey: ['daily-action'] });
      }

      return ok;
    },
    { tag: 'podcast-player-view' }
  );

  const [liked, toggleLiked] = useDebouncedToggle(
    !!data?.has_like,
    async () => {
      if (!podcast?.id) return false;

      return await toggleFavourite(podcast.id, 'podcast');
    },
    { tag: 'podcast-player-view' }
  );

  const handleLike = () => {
    if (!podcast?.id) return;
    toggleLiked();
  };

  /** Waveform giả lập */
  useEffect(() => {
    const bars = Array.from({ length: WAVEFORM_BARS }, (_, i) => {
      const baseHeight = 14 + Math.sin(i * 0.3) * 9;
      const randomness = Math.random() * 13;
      return Math.max(8, Math.min(WAVEFORM_HEIGHT - 8, baseHeight + randomness));
    });
    setWaveformData(bars);
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
  const leaveScreen = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'home' }] })
    );
  }, [navigation]);

  const { requestLeave, dialogProps } = useTopicFollowPrompt({
    topic,
    alreadyFollowed: subscribed,
    onLeave: leaveScreen,
    tag: 'podcast-player-view',
  });

  const handleOpenSourceVideo = () => {
    if (!video?.id_content) return;
    navigation.navigate('media', {
      screen: 'flash-media-preview',
      params: { media: video },
    });
  };

  /* ---------------- Actions ---------------- */

  const handleShare = () => {
    if (!podcast) return;

    const contentId = podcast.id;

    orthomasterShare(
      {
        title,
        message:
          "Voici un contenu intéressant à écouter sur OrthoMaster :\n\n" +
          title +
          (subtitle ? ` par ${subtitle}` : '') +
          "\n\n" +
          "https://go.orthomaster.fr/open/podcast/" +
          contentId,
      },
      "podcast",
      contentId
    );
  };

  const formatTime = (millis: number) => {
    if (!millis) return '0:00';
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

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
        <View style={styles.errorHeader}>
          <TouchableOpacity onPress={leaveScreen} style={styles.iconButton}>
            <Ionicons name="close" size={30} color={Colors.white} />
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
      activeOpacity={0.7}
      style={styles.actionButton}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.actionIconWrap, active && styles.actionIconWrapActive]}>
        <Ionicons name={icon} size={22} color={active ? Colors.primary : Colors.white} />
      </View>
      <Text style={[styles.actionLabel, active && styles.actionLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* 1. Thumbnail tràn từ mép trên */}
      <View style={styles.thumbnailWrapper}>
        {thumbnailUrl ? (
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Ionicons name="mic" size={IMAGE_HEIGHT * 0.35} color={Colors.subtext2} />
          </View>
        )}

        {/* Hoà ảnh vào nền tối bên dưới */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)', Colors.blackBackground]}
          style={styles.thumbnailFade}
          pointerEvents="none"
        />
      </View>

      {/* Close: absolute, đè lên ảnh */}
      <TouchableOpacity
        onPress={requestLeave}
        style={[styles.closeFloating, { top: insets.top + Spacings.sm }]}
      >
        <Ionicons name="close" size={30} color={Colors.white} />
      </TouchableOpacity>

      {/* Toast */}
      {!!toastMessage && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              top: insets.top + 60,
              transform: [{ translateY: toastTranslateY }],
              opacity: toastOpacity,
            },
          ]}
        >
          <Ionicons name="notifications" size={20} color={Colors.primary} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}

      {/* 2. Player: waveform + time + controls trong cùng một khối */}
      <View style={styles.playerGroup}>
        <View
          ref={waveRef}
          onLayout={handleWaveLayout}
          {...panResponder.panHandlers}
          style={styles.waveformContainer}
        >
          {isLoadingAudio ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Svg height={WAVEFORM_HEIGHT} width="100%">
              {waveformData.map((barHeight, index) => {
                const barProgress = index / WAVEFORM_BARS;
                const isActive = barProgress <= displayRatio;
                const barWidth = waveWidth / WAVEFORM_BARS - 2;

                return (
                  <Rect
                    key={index}
                    x={index * (barWidth + 2)}
                    y={(WAVEFORM_HEIGHT - barHeight) / 2}
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

        <View style={styles.timeContainer}>
          <Text style={styles.time}>{formatTime(displayPosition)}</Text>
          <Text style={styles.time}>{formatTime(duration)}</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            onPress={skipBackward}
            disabled={!sound || isLoadingAudio}
            style={styles.controlButton}
          >
            <Ionicons name="play-back" size={26} color={Colors.white} />
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
                size={34}
                color={Colors.primary}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={skipForward}
            disabled={!sound || isLoadingAudio}
            style={styles.controlButton}
          >
            <Ionicons name="play-forward" size={26} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Thông tin: cuộn được */}
      <ScrollView
        style={styles.infoScroll}
        contentContainerStyle={styles.infoContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title} numberOfLines={3}>{title}</Text>

        {!!subtitle && (
          <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>
        )}

        {topic && (
          <View style={styles.topicContainer}>
            <View style={styles.topicBadge}>
              <Text style={styles.topicText}>{topic.name}</Text>
            </View>
          </View>
        )}

        {/* Video nguồn - tự ẩn nếu podcast.content null */}
        <SourceVideoCard video={video} onPress={handleOpenSourceVideo} />
      </ScrollView>

      {/* 4. Actions: cố định ở đáy, nền trong suốt */}
      <View style={[styles.bottomLayer, { paddingBottom: insets.bottom + Spacings.sm }]}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <View style={styles.actionsRow}>
          {renderAction('share', 'share-social-outline', 'Partager', handleShare)}

          {/* {!!topic &&
            renderAction(
              'follow',
              subscribed ? 'notifications' : 'notifications-outline',
              'Suivre',
              handleSubscribeTopic,
              subscribed
            )} */}

          {renderAction(
            'like',
            liked ? 'heart' : 'heart-outline',
            "Sauvegarder",
            handleLike,
            liked
          )}
        </View>
      </View>

      <TopicFollowDialog {...dialogProps} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.blackBackground,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.blackBackground,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacings.md,
    marginBottom: 150,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacings.lg,
    paddingVertical: 12,
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

  /* ---- 1. Thumbnail ---- */
  thumbnailWrapper: {
    width: '100%',
    height: IMAGE_HEIGHT,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: IMAGE_HEIGHT * 0.5,
  },

  /* ---- Close ---- */
  closeFloating: {
    position: 'absolute',
    left: Spacings.lg,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 20,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 20,
  },

  /* ---- Toast ---- */
  toastContainer: {
    position: 'absolute',
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

  /* ---- 2. Player group ---- */
  playerGroup: {
    marginHorizontal: Spacings.lg,
    marginTop: Spacings.md,
    padding: Spacings.md,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  waveformContainer: {
    height: WAVEFORM_HEIGHT,
    justifyContent: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacings.xxs,
    marginBottom: Spacings.sm,
  },
  time: {
    color: Colors.gray,
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacings.xxl,
  },
  controlButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacings.xxs,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },

  /* ---- 3. Infos ---- */
  infoScroll: {
    flex: 1,
  },
  infoContent: {
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.lg,
    paddingBottom: BOTTOM_BAR_SPACE,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacings.xxs,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    color: Colors.subtext2,
    textAlign: 'center',
  },
  topicContainer: {
    alignItems: 'center',
    marginTop: Spacings.sm,
    marginBottom: Spacings.lg,
  },
  topicBadge: {
    paddingHorizontal: Spacings.md,
    paddingVertical: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  topicText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.primary,
    letterSpacing: 0.6,
  },

  /* ---- 4. Actions cố định ---- */
  bottomLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: Spacings.xl,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacings.lg,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  actionIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  actionIconWrapActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  actionLabel: {
    fontSize: 12,
    letterSpacing: 0.3,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    textAlign: 'center',
  },
  actionLabelActive: {
    color: Colors.primary,
  },
});

export default PodcastPlayerView;