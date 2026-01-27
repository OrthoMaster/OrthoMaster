import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Audio } from 'expo-av';
import { Svg, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import { addTopic } from '../../../services/v2/AuthService';

const { width, height } = Dimensions.get('window');
const WAVEFORM_BARS = 50;

interface PodcastPlayerModalProps {
  visible: boolean;
  onClose: () => void;
  audioUrl: string;
  thumbnailUrl: string;
  title: string;
  subtitle?: string;
  author?: string;
  topic?: any;
  isSubcribed: boolean
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
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);
  const [subscribed, setSubscribed] = useState<boolean>(isSubcribed);
  const queryClient = useQueryClient();

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(-100)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;

  // Generate fake waveform data
  useEffect(() => {
    const data = Array.from({ length: WAVEFORM_BARS }, (_, i) => {
      const baseHeight = 15 + Math.sin(i * 0.3) * 10;
      const randomness = Math.random() * 15;
      return Math.max(8, Math.min(45, baseHeight + randomness));
    });
    setWaveformData(data);
  }, []);

  // Animate modal when visible changes
  useEffect(() => {
    if (visible) {
      // Zoom in animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animation values
      scaleAnim.setValue(0.3);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  // Toast animation
  useEffect(() => {
    if (showToast) {
      // Show toast animation
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

      // Hide toast after 3 seconds
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

  // Load audio when modal opens
  useEffect(() => {
    if (visible && audioUrl) {
      loadAudio();
    }

    // Cleanup when modal closes
    return () => {
      if (sound) {
        sound.unloadAsync();
        setHasFinished(false);
      }
    };
  }, [visible, audioUrl]);

  // Pause when modal closes
  useEffect(() => {
    if (!visible && sound) {
      sound.pauseAsync();
    }
  }, [visible]);

  const loadAudio = async () => {
    try {
      setIsLoading(true);

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

      setSound(newSound);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading audio:', error);
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis);
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish) {
        setIsPlaying(false);
        setHasFinished(true);
      }
    }
  };

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
      console.error('Error toggling play/pause:', error);
    }
  };

  const skipForward = async () => {
    if (!sound) return;
    const newPosition = Math.min(position + 15000, duration);
    await sound.setPositionAsync(newPosition);
  };

  const skipBackward = async () => {
    if (!sound) return;
    const newPosition = Math.max(position - 15000, 0);
    await sound.setPositionAsync(newPosition);
  };

  const handleClose = async () => {
    // Zoom out animation before closing
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.3,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (sound) {
        sound.pauseAsync();
      }
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

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
      transparent={true}
    >
      <Animated.View
        style={[
          styles.modalOverlay,
          {
            opacity: opacityAnim,
            paddingTop: Platform.OS === 'android' ? Spacings.lg : Spacings.xxl
          }
        ]}
      >
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ scale: scaleAnim }],
            }
          ]}
        >
          <View style={styles.safeArea} >
            <StatusBar barStyle="light-content" />

            <View style={styles.container}>
              {/* Toast Notification */}
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

              {/* Header with close button */}
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

              {/* Thumbnail or Icon */}
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
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>

              {/* Subtitle */}
              {subtitle && (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
              )}

              {author && (
                <View style={styles.authorContainer}>
                  <Ionicons name="person-outline" size={14} color={Colors.gray} />
                  <Text style={styles.authorText}>{author}</Text>
                </View>
              )}


              {/* Topic Badge - Tinh tế */}
              {topic && (
                <View style={styles.topicContainer}>
                  <View style={styles.topicBadge}>
                    <Text style={styles.topicText}>{topic.name}</Text>
                  </View>
                </View>
              )}

              {/* Waveform */}
              <View style={styles.waveformContainer}>
                {isLoading ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Svg height="60" width="100%">
                    {waveformData.map((height, index) => {
                      const barProgress = index / WAVEFORM_BARS;
                      const isActive = barProgress <= progress;
                      const barWidth = (width - 40) / WAVEFORM_BARS - 2;

                      return (
                        <Rect
                          key={index}
                          x={index * (barWidth + 2)}
                          y={(60 - height) / 2}
                          width={barWidth}
                          height={height}
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
                <Text style={styles.time}>{formatTime(position)}</Text>
                <Text style={styles.time}>{formatTime(duration)}</Text>
              </View>

              {/* Controls */}
              <View style={styles.controls}>
                <TouchableOpacity
                  onPress={skipBackward}
                  disabled={!sound || isLoading}
                  style={styles.controlButton}
                >
                  <Ionicons name="play-back" size={28} color={Colors.white} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.playButton}
                  onPress={togglePlayPause}
                  disabled={!sound || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="large" color={Colors.white} />
                  ) : (
                    <Ionicons
                      name={
                        hasFinished
                          ? 'reload'
                          : isPlaying
                            ? 'pause'
                            : 'play'
                      }
                      size={40}
                      color={Colors.white}
                    />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={skipForward}
                  disabled={!sound || isLoading}
                  style={styles.controlButton}
                >
                  <Ionicons name="play-forward" size={28} color={Colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    paddingTop: Spacings.lg
  },
  modalContent: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.blackBackground,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.blackBackground,
    paddingHorizontal: Spacings.lg,
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
    color: 'white',
    textAlign: 'center',
    marginBottom: Spacings.xs,
    paddingHorizontal: Spacings.lg,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    color: Colors.subtext2,
    textAlign: 'center',
    marginBottom: Spacings.sm,
  },
  // Topic styles - tinh tế
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
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.primary,
    letterSpacing: 0.3,
  },
  waveformContainer: {
    height: 60,
    justifyContent: 'center',
    marginBottom: Spacings.md,
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
    position: 'relative',
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
    borderColor: '#2a2a2a',
  },
  additionalControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacings.xl,
  },
  additionalButton: {
    padding: Spacings.xs,
  },

  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: Spacings.sm,
  },
  authorText: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    fontStyle: 'italic',
  },
});