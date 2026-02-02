import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Svg, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import { addTopic } from '../../../services/v2/AuthService';

const WAVEFORM_BARS = 60;

interface PodcastPlayerModalProps {
  visible: boolean;
  onClose: () => void;
  audioUrl: string;
  thumbnailUrl: string;
  title: string;
  subtitle?: string;
  author?: string;
  topic?: any;
  isSubcribed: boolean;
}

export const PodcastPlayerModal: React.FC<PodcastPlayerModalProps> = ({
  visible = false,
  onClose,
  audioUrl,
  thumbnailUrl,
  title = "Podcast Title",
  subtitle,
  author,
  topic,
  isSubcribed = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);
  const [subscribed, setSubscribed] = useState<boolean>(isSubcribed);
  const [containerWidth, setContainerWidth] = useState(460);
  const [loadError, setLoadError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(-100)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration * 1000);
      setIsLoading(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setPosition(audioRef.current.currentTime * 1000);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setHasFinished(true);
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleError = (e) => {
    if (audioRef.current && audioRef.current.src) {
      setLoadError('Impossible de charger l\'audio');
      setIsLoading(false);
    }
  };

  const cleanupAudio = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current.removeEventListener('play', handlePlay);
        audioRef.current.removeEventListener('pause', handlePause);
        audioRef.current.removeEventListener('error', handleError);
        audioRef.current.src = '';
        audioRef.current = null;
      } catch (error) { }
    }
  };

  useEffect(() => {
    const data = Array.from({ length: WAVEFORM_BARS }, (_, i) => {
      const baseHeight = 15 + Math.sin(i * 0.3) * 10;
      const randomness = Math.random() * 15;
      return Math.max(8, Math.min(45, baseHeight + randomness));
    });
    setWaveformData(data);
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  useEffect(() => {
    if (showToast) {
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
        ]).start(() => {
          setShowToast(false);
        });
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [showToast]);

  useEffect(() => {
    if (visible && audioUrl) {
      loadAudio();
    }

    return () => {
      cleanupAudio();
    };
  }, [visible, audioUrl]);

  useEffect(() => {
    if (!visible && audioRef.current) {
      audioRef.current.pause();
    }
  }, [visible]);

  const loadAudio = () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      if (!audioRef.current) {
        audioRef.current = new Audio();
        
        audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
        audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.addEventListener('ended', handleEnded);
        audioRef.current.addEventListener('play', handlePlay);
        audioRef.current.addEventListener('pause', handlePause);
        audioRef.current.addEventListener('error', handleError);
      }

      audioRef.current.src = audioUrl;
      audioRef.current.load();

    } catch (error) {
      setLoadError(`Erreur: ${error.message}`);
      setIsLoading(false);
    }
  };

  const togglePlayPause = async () => {
    if (!audioRef.current) return;

    try {
      if (hasFinished) {
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
        setHasFinished(false);
      } else if (isPlaying) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
    } catch (error) {}
  };

  const skipForward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(
      audioRef.current.currentTime + 15,
      audioRef.current.duration
    );
  };

  const skipBackward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 15, 0);
  };

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      cleanupAudio();
      onClose?.();
    });
  };

  const handleSubscribeTopic = async () => {
    toastTranslateY.setValue(-100);
    toastOpacity.setValue(0);
    setShowToast(true);

    if (topic && !isSubcribed) {
      setSubscribed(true);
      await addTopic(topic.id);
      await queryClient.invalidateQueries({ queryKey: ['current-user'] });
      await queryClient.invalidateQueries({ queryKey: ['daily-action'] });
    }
  };

  const formatTime = (millis) => {
    if (!millis) return '0:00';
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? position / duration : 0;

  const handleWaveformLayout = (event) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  if (!visible) return null;

  const barWidth = Math.max(3, (containerWidth - (WAVEFORM_BARS * 2)) / WAVEFORM_BARS);
  const barGap = 2;

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.modalContent,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        <View style={styles.container}>
          {showToast && (
            <Animated.View
              style={[
                styles.toastContainer,
                {
                  transform: [{ translateY: toastTranslateY }],
                  opacity: toastOpacity,
                }
              ]}
            >
              <Ionicons name="notifications" size={20} color={Colors.primary} />
              <Text style={styles.toastText}>Vous suivez le sujet {topic.name}</Text>
            </Animated.View>
          )}

          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color={Colors.white} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSubscribeTopic} style={styles.moreButton}>
              {subscribed
                ? <Ionicons name="heart" size={24} color={Colors.primary} />
                : <Ionicons name="heart-outline" size={24} color={Colors.white} />
              }
            </TouchableOpacity>
          </View>

          <View style={styles.thumbnailContainer}>
            {thumbnailUrl ? (
              <View style={styles.thumbnail}>
                <Image
                  source={{ uri: thumbnailUrl }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <View style={styles.iconPlaceholder}>
                <Ionicons name="mic" size={80} color={Colors.subtext2} />
              </View>
            )}
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
              {title}
            </Text>

            {subtitle && (
              <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
                {subtitle}
              </Text>
            )}

            {author && (
              <View style={styles.authorContainer}>
                <Ionicons name="person-outline" size={12} color={Colors.gray} />
                <Text style={styles.authorText} numberOfLines={1}>
                  {author}
                </Text>
              </View>
            )}

            {topic && (
              <View style={styles.topicContainer}>
                <View style={styles.topicBadge}>
                  <Text style={styles.topicText} numberOfLines={1}>
                    {topic.name}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {loadError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{loadError}</Text>
            </View>
          )}

          <View style={styles.waveformContainer} onLayout={handleWaveformLayout}>
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Svg height="50" width={containerWidth}>
                {waveformData.map((height, index) => {
                  const barProgress = index / WAVEFORM_BARS;
                  const isActive = barProgress <= progress;
                  const scaledHeight = height * 0.9;

                  return (
                    <Rect
                      key={index}
                      x={index * (barWidth + barGap)}
                      y={(50 - scaledHeight) / 2}
                      width={barWidth}
                      height={scaledHeight}
                      fill={isActive ? Colors.primary : '#333'}
                      rx={barWidth / 2}
                    />
                  );
                })}
              </Svg>
            )}
          </View>

          <View style={styles.timeContainer}>
            <Text style={styles.time}>{formatTime(position)}</Text>
            <Text style={styles.time}>{formatTime(duration)}</Text>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity
              onPress={skipBackward}
              disabled={isLoading || !duration || !!loadError}
              style={[styles.controlButton, (isLoading || !duration || !!loadError) && styles.controlButtonDisabled]}
            >
              <Ionicons name="play-back" size={24} color={(isLoading || !duration || !!loadError) ? Colors.gray : Colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.playButton, (isLoading || !duration || !!loadError) && styles.playButtonDisabled]}
              onPress={togglePlayPause}
              disabled={isLoading || !duration || !!loadError}
            >
              {isLoading || !duration ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Ionicons
                  name={
                    hasFinished
                      ? 'reload'
                      : isPlaying
                        ? 'pause'
                        : 'play'
                  }
                  size={36}
                  color={Colors.white}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={skipForward}
              disabled={isLoading || !duration || !!loadError}
              style={[styles.controlButton, (isLoading || !duration || !!loadError) && styles.controlButtonDisabled]}
            >
              <Ionicons name="play-forward" size={24} color={(isLoading || !duration || !!loadError) ? Colors.gray : Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: Spacings.lg,
  },
  modalContent: {
    backgroundColor: Colors.blackBackground,
    borderRadius: 24,
    maxWidth: 500,
    width: '100%',
    height: '95%',
    maxHeight: 700,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
  },
  container: {
    flex: 1,
    backgroundColor: Colors.blackBackground,
    paddingHorizontal: Spacings.lg,
    display: 'flex',
    flexDirection: 'column',
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
    paddingVertical: Spacings.md,
    flexShrink: 0,
  },
  closeButton: {
    padding: 8,
    cursor: 'pointer',
  },
  moreButton: {
    padding: 8,
    cursor: 'pointer',
  },
  thumbnailContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacings.sm,
    minHeight: 0,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    maxWidth: 350,
    maxHeight: 350,
    borderRadius: 16,
  },
  iconPlaceholder: {
    width: '100%',
    height: '100%',
    maxWidth: 350,
    maxHeight: 350,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    flexShrink: 0,
    paddingVertical: Spacings.sm,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: 'white',
    textAlign: 'center',
    marginBottom: 4,
    paddingHorizontal: Spacings.sm,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.subtext2,
    textAlign: 'center',
    marginBottom: 4,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 4,
  },
  authorText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    fontStyle: 'italic',
  },
  topicContainer: {
    alignItems: 'center',
    marginBottom: Spacings.sm,
  },
  topicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacings.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  topicText: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: Colors.primary,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 8,
    padding: Spacings.sm,
    marginBottom: Spacings.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
  },
  waveformContainer: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacings.xs,
    flexShrink: 0,
    width: '100%',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacings.xxs,
    marginBottom: Spacings.sm,
    flexShrink: 0,
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
    gap: Spacings.xl,
    paddingBottom: Spacings.lg,
    flexShrink: 0,
  },
  controlButton: {
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  },
  controlButtonDisabled: {
    cursor: 'not-allowed',
    opacity: 0.5,
  },
  playButton: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2a2a2a',
    cursor: 'pointer',
  },
  playButtonDisabled: {
    cursor: 'not-allowed',
    opacity: 0.7,
  },
});