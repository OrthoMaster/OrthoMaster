import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Animated,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

const { width, height } = Dimensions.get('window');
const topicWidth = width > 700 
  ? Math.floor((width - 2 * Spacings.lg - 8 * Spacings.sm) / 9)
  : Math.floor((width - 2 * Spacings.lg - 2 * Spacings.sm) / 3);

interface Topic {
  id: string;
  name: string;
  image?: string;
  description?: string;
}

interface TopicsOnboardingModalProps {
  visible: boolean;
  topics: Topic[];
  onComplete: (selectedTopicIds: string[]) => void;
  onSkip?: () => void;
}

interface TopicCardProps {
  topic: Topic;
  isSelected: boolean;
  onToggle: (topicId: string) => void;
  delay: number;
}

const TopicCard: React.FC<TopicCardProps> = ({ topic, isSelected, onToggle, delay }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    // Pulse animation when selected
    if (isSelected) {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isSelected]);

  return (
    <Animated.View
      style={[
        styles.topicCard,
        {
          width: topicWidth,
          minHeight: topicWidth,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <TouchableOpacity
        onPress={() => onToggle(topic.id)}
        activeOpacity={0.7}
        style={styles.topicCardTouchable}
      >
        <Animated.View
          style={[
            styles.topicImageContainer,
            { width: topicWidth, height: topicWidth },
            isSelected && styles.topicImageContainerSelected,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          {topic.image ? (
            <Image
              source={{ uri: process.env.EXPO_PUBLIC_S3_URL + topic.image }}
              style={styles.topicImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.topicImagePlaceholder}>
              <Ionicons name="image-outline" size={24} color={Colors.gray} />
            </View>
          )}

          {/* Selection overlay */}
          {isSelected && (
            <View style={styles.selectedOverlay}>
              <View style={styles.checkmarkContainer}>
                <Ionicons name="checkmark" size={20} color={Colors.white} />
              </View>
            </View>
          )}
        </Animated.View>

        <Text
          style={[
            styles.topicCardText,
            isSelected && styles.topicCardTextSelected
          ]}
          numberOfLines={2}
        >
          {topic.name}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const TopicsOnboardingModal: React.FC<TopicsOnboardingModalProps> = ({
  visible,
  topics,
  onComplete,
  onSkip,
}) => {
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animations
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Entrance animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();

      // Header animation
      Animated.sequence([
        Animated.delay(200),
        Animated.spring(headerAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations
      slideAnim.setValue(height);
      fadeAnim.setValue(0);
      headerAnim.setValue(0);
    }
  }, [visible]);

  const handleToggleTopic = (topicId: string) => {
    setSelectedTopicIds(prev => {
      const isCurrentlySelected = prev.includes(topicId);
      if (isCurrentlySelected) {
        return prev.filter(id => id !== topicId);
      } else {
        return [...prev, topicId];
      }
    });
  };

  const handleContinue = async () => {
    setIsSubmitting(true);
    await onComplete(selectedTopicIds);
    setIsSubmitting(false);
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  const headerScale = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            { opacity: fadeAnim }
          ]}
        />

        {/* Content */}
        <Animated.View
          style={[
            styles.contentContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Skip button */}
          {onSkip && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText}>Passer</Text>
            </TouchableOpacity>
          )}

          {/* Header */}
          <Animated.View
            style={[
              styles.header,
              { transform: [{ scale: headerScale }] }
            ]}
          >
            <View style={styles.iconWrapper}>
              <View style={styles.iconBackground}>
                <Ionicons name="heart" size={50} color={Colors.red} />
              </View>
              <View style={styles.iconSpark1}>
                <Ionicons name="sparkles" size={16} color={Colors.primary} />
              </View>
              <View style={styles.iconSpark2}>
                <Ionicons name="sparkles" size={12} color={Colors.primary} />
              </View>
            </View>

            <Text style={styles.title}>Personnalisez votre expérience</Text>
            <Text style={styles.subtitle}>
              Sélectionnez vos centres d’intérêt pour des contenus plus appropriés 
            </Text>
          </Animated.View>

          {/* Topics Grid */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {topics.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="albums-outline" size={48} color={Colors.gray} />
                <Text style={styles.emptyText}>Aucun centre d'intérêt disponible</Text>
              </View>
            ) : (
              <View style={styles.topicsGrid}>
                {topics.map((topic, index) => (
                  <TopicCard
                    key={topic.id}
                    topic={topic}
                    isSelected={selectedTopicIds.includes(topic.id)}
                    onToggle={handleToggleTopic}
                    delay={index * 50}
                  />
                ))}
              </View>
            )}

            <View style={{ height: 160 }}></View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.continueButtonText}>
                  Appliquer
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  contentContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: height * 0.85,
    paddingTop: Spacings.xl,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  skipButton: {
    position: 'absolute',
    top: Spacings.md,
    right: Spacings.lg,
    zIndex: 10,
    padding: Spacings.sm,
  },
  skipButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.gray,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: Spacings.xl,
    marginBottom: Spacings.lg,
    marginTop: -60,
  },
  iconWrapper: {
    position: 'relative',
    marginBottom: Spacings.md,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.orange2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconSpark1: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  iconSpark2: {
    position: 'absolute',
    bottom: 4,
    left: -4,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacings.xs,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacings.sm,
  },
  scrollContent: {
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.sm,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: Spacings.sm,
  },
  topicCard: {
    alignItems: 'center',
    marginBottom: Spacings.md,
  },
  topicCardTouchable: {
    alignItems: 'center',
  },
  topicImageContainer: {
    borderRadius: 100,
    overflow: 'hidden',
    marginBottom: Spacings.xs,
    backgroundColor: Colors.grayLight,
    borderWidth: 3,
    borderColor: 'transparent',
    position: 'relative',
  },
  topicImageContainerSelected: {
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  topicImage: {
    width: '100%',
    height: '100%',
  },
  topicImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicCardText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.subtext2,
    textAlign: 'center',
    lineHeight: 14,
    maxWidth: topicWidth,
  },
  topicCardTextSelected: {
    color: Colors.primary,
    fontFamily: 'Poppins-Medium',
  },
  emptyContainer: {
    paddingVertical: Spacings.xxl * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    marginTop: Spacings.md,
    textAlign: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    paddingHorizontal: Spacings.xl,
    paddingBottom: Platform.OS === 'ios' ? Spacings.xxl : Spacings.xxxl,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  continueButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacings.md + 2,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    marginRight: Spacings.sm,
  },
});
