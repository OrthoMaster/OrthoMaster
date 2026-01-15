import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
  Animated,
  ScrollView,
  ActivityIndicator
} from 'react-native';

import { useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import { answerDailyQuestion } from '../../../services/v2/ContentService';
import { addTopic } from '../../../services/v2/AuthService';
import CelebrationScreen from '../../animation/CelebrationScreen';

const { width, height } = Dimensions.get('window');

interface DailyQuestionModalProps {
  visible: boolean;
  data: any;
  onClose: () => void;
}

export const DailyQuestionModal: React.FC<DailyQuestionModalProps> = ({
  visible,
  data,
  onClose,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(data.user_answer_id);
  const [showResults, setShowResults] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const [showCelebration, setShowCelebration] = useState(false);

  const progressAnimations = useRef(
    data.question.answers.map(() => new Animated.Value(0))
  ).current;

  const explanationOpacity = useRef(new Animated.Value(0)).current;

  // Calculate percentage after user's answer
  const calculatePercentage = (answer: any): number => {
    if (!showResults) {
      return answer.percentage || 0;
    }

    const totalCount = data.question.count + 1; // +1 for current user's answer
    const answerCount = answer.id === selectedAnswer
      ? answer.count + 1 // Selected answer
      : answer.count; // Unselected answer

    return Math.round((answerCount / totalCount) * 100);
  };

  // Function to calculate width for progress bar (minimum 4% to always display)
  const getProgressBarWidth = (percentage: number): string => {
    if (percentage === 0) {
      return '4%'; // Display a small bar even when 0%
    }
    return `${percentage}%`;
  };

  useEffect(() => {
    if (visible) {
      const hasUserAnswer = !!data.user_answer_id;

      setSelectedAnswer(hasUserAnswer ? data.user_answer_id : null);
      setShowResults(hasUserAnswer);

      progressAnimations.forEach(anim => anim.setValue(0));
      explanationOpacity.setValue(0);

      Animated.spring(animation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();

      // Trigger animation for results if user has already answered
      if (hasUserAnswer) {
        setTimeout(() => {
          const progressAnimationSequence = data.question.answers.map((answer, index) => {
            const calculatedPercentage = calculatePercentage(answer);
            return Animated.timing(progressAnimations[index], {
              toValue: calculatedPercentage,
              duration: 800,
              delay: index * 100,
              useNativeDriver: false,
            });
          });

          const explanationAnimation = Animated.timing(explanationOpacity, {
            toValue: 1,
            duration: 400,
            delay: 400,
            useNativeDriver: true,
          });

          Animated.sequence([
            Animated.parallel(progressAnimationSequence),
            explanationAnimation,
          ]).start();
        }, 300); // Small delay to let modal animation run first
      }
    } else {
      animation.setValue(0);
    }
  }, [visible, data.user_answer_id]);

  useEffect(() => {
    if (showResults) {
      const progressAnimationSequence = data.question.answers.map((answer, index) => {
        const calculatedPercentage = calculatePercentage(answer);
        return Animated.timing(progressAnimations[index], {
          toValue: calculatedPercentage,
          duration: 800,
          delay: index * 100,
          useNativeDriver: false,
        });
      });

      const explanationAnimation = Animated.timing(explanationOpacity, {
        toValue: 1,
        duration: 400,
        delay: 400,
        useNativeDriver: true,
      });

      Animated.sequence([
        Animated.parallel(progressAnimationSequence),
        explanationAnimation,
      ]).start();
    }
  }, [showResults]);

  const handleAnswerPress = (answerId: string) => {
    if (showResults) return;
    setSelectedAnswer(answerId);
  };

  const handleValidate = async () => {
    if (!selectedAnswer) return;

    if (!showResults) {
      setShowResults(true);
      setIsLoading(true);

      const selectedAnswerObj = data.question.answers.find(
        answer => answer.id === selectedAnswer
      );
      if (selectedAnswerObj && selectedAnswerObj.correct_flg) {
        setShowCelebration(true);
      }
      
      await answerDailyQuestion(data.question.id, selectedAnswer);
      setIsLoading(false);
    } else {
      if (data.has_topic_question) {
        onClose();
      } else {
        handleSubscribeTopic();
      }
    }
  };

  const handleSubscribeTopic = async () => {
    setIsLoading(true);

    await addTopic(data.question.topic.id);
    await queryClient.invalidateQueries({ queryKey: ['current-user'] });
    await queryClient.invalidateQueries({ queryKey: ['daily-action'] });
    setIsLoading(false);
    onClose();
  };

  const getAnswerStyle = (answer: any) => {
    if (!showResults) {
      if (answer.id === selectedAnswer) {
        return [styles.answerButton, styles.selectedAnswer];
      }
      return styles.answerButton;
    }

    if (answer.correct_flg) {
      return [styles.answerButton, styles.correctAnswer];
    }

    if (answer.id === selectedAnswer && !answer.correct_flg) {
      return [styles.answerButton, styles.incorrectAnswer];
    }

    return [styles.answerButton, styles.disabledAnswer];
  };

  const getButtonText = () => {
    if (!showResults) {
      return 'Valider';
    }
    if (data.has_topic_question) {
      return 'Fermer';
    }
    return `Suivre le sujet ${data.question.topic.name}`;
  };

  const isButtonDisabled = !selectedAnswer && !showResults;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [
                {
                  scale: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
              opacity: animation,
            },
          ]}
        >
          <LinearGradient
            colors={[Colors.blue, Colors.purple]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <Ionicons name="bulb" size={28} color={Colors.white} />
              <Text style={styles.headerTitle}>Question du jour</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.white} />
            </Pressable>
          </LinearGradient>

          <View style={styles.contentWrapper}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.questionContainer}>
                <View style={styles.topicLabel}>
                  <Text style={styles.topicText}>{data.question.topic.name}</Text>
                </View>
                <Text style={styles.questionText}>{data.question.question}</Text>
              </View>

              <View style={styles.answersContainer}>
                {data.question.answers.map((answer, index) => {
                  const displayPercentage = calculatePercentage(answer);

                  return (
                    <View key={answer.id} style={styles.answerWrapper}>
                      <Pressable
                        onPress={() => handleAnswerPress(answer.id)}
                        disabled={showResults}
                        style={({ pressed }) => [
                          getAnswerStyle(answer),
                          pressed && !showResults && styles.answerPressed,
                        ]}
                      >
                        <View style={styles.answerContent}>
                          <View style={styles.answerLeft}>
                            <Text style={styles.answerText}>
                              {String.fromCharCode(65 + index)}. {answer.text}
                            </Text>
                          </View>
                        </View>

                        {showResults && (
                          <View style={styles.statsContainer}>
                            <View style={styles.progressBarBackground}>
                              <Animated.View
                                style={[
                                  styles.progressBar,
                                  {
                                    width: progressAnimations[index].interpolate({
                                      inputRange: [0, 100],
                                      outputRange: ['4%', '100%'],
                                    }),
                                    backgroundColor: answer.correct_flg
                                      ? Colors.success
                                      : answer.id === selectedAnswer
                                        ? Colors.danger
                                        : Colors.gray,
                                  },
                                ]}
                              />
                            </View>
                            <Text style={styles.percentageText}>
                              {displayPercentage}%
                            </Text>
                          </View>
                        )}

                        {showResults && answer.id === selectedAnswer && data.question.explanation && (
                          <Animated.View
                            style={[
                              styles.explanationContainer,
                              {
                                opacity: explanationOpacity,
                                borderTopColor: answer.correct_flg
                                  ? Colors.success + '30'
                                  : Colors.danger + '30',
                              }
                            ]}
                          >
                            <View style={styles.explanationHeader}>
                              <Ionicons
                                name={answer.correct_flg ? "information-circle" : "close-circle"}
                                size={18}
                                color={answer.correct_flg ? Colors.success : Colors.danger}
                              />
                              <Text style={[
                                styles.explanationTitle,
                                { color: answer.correct_flg ? Colors.success : Colors.danger }
                              ]}>
                                {answer.correct_flg ? "Explication" : "Dommage, incorrect"}
                              </Text>
                            </View>
                            <Text style={styles.explanationText}>{data.question.explanation}</Text>
                          </Animated.View>
                        )}
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          <View style={styles.buttonContainer}>
            <Pressable
              style={[
                styles.validateButton,
                (isButtonDisabled || isLoading) && styles.validateButtonDisabled
              ]}
              onPress={handleValidate}
              disabled={isButtonDisabled || isLoading}
            >
              {showResults && (
                isLoading ?
                  <ActivityIndicator size="small" color={Colors.white} />
                  :
                  <Ionicons
                    name={data.has_topic_question ? "close" : "notifications"}
                    size={20}
                    color={Colors.white}
                  />
              )}
              <Text
                style={[
                  styles.validateButtonText,
                  { textAlign: showResults ? 'center' : 'center' }
                ]}
                numberOfLines={2}
              >
                {getButtonText()}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>

      <CelebrationScreen
        visible={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 500,
    height: height * 0.75,
    backgroundColor: Colors.white,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.gray,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacings.md,
    paddingVertical: Spacings.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    color: Colors.white,
    fontFamily: 'Poppins-Bold',
    marginLeft: Spacings.sm,
  },
  closeButton: {
    padding: Spacings.xs,
  },
  contentWrapper: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacings.md,
  },
  topicLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successBackground,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.xxs,
    borderRadius: 16,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.success,
    marginTop: Spacings.md,
    marginBottom: Spacings.sm
  },
  topicText: {
    fontSize: 12,
    color: Colors.success,
    fontFamily: 'Poppins-Medium',
    marginLeft: Spacings.xxs,
  },
  questionContainer: {
    paddingHorizontal: Spacings.lg,
    paddingBottom: Spacings.md,
    backgroundColor: Colors.grayLight,
    marginBottom: Spacings.lg,
  },
  questionText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',
  },
  explanationContainer: {
    marginTop: Spacings.md,
    paddingTop: Spacings.md,
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacings.xs,
  },
  explanationTitle: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Poppins-Medium',
    marginLeft: Spacings.xxs,
  },
  explanationText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
    fontFamily: 'Poppins-Regular',
  },
  answersContainer: {
    paddingHorizontal: Spacings.lg,
  },
  answerWrapper: {
    marginBottom: Spacings.md,
  },
  answerButton: {
    backgroundColor: Colors.grayLight,
    borderRadius: 12,
    padding: Spacings.md,
    borderWidth: 2,
    borderColor: Colors.line,
  },
  answerPressed: {
    backgroundColor: Colors.white,
    transform: [{ scale: 0.98 }],
  },
  selectedAnswer: {
    backgroundColor: Colors.blueBackground,
    borderColor: Colors.blue,
  },
  correctAnswer: {
    backgroundColor: Colors.successBackground,
    borderColor: Colors.success,
  },
  incorrectAnswer: {
    backgroundColor: Colors.dangerBackground,
    borderColor: Colors.danger,
  },
  disabledAnswer: {
    backgroundColor: Colors.grayLight,
    borderColor: Colors.gray,
  },
  answerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  answerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  answerText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
  },
  statsContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.grayLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 12,
    color: Colors.gray,
    width: 45,
    textAlign: 'right',
    fontFamily: 'Poppins-Medium',
  },
  buttonContainer: {
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.md,
  },
  validateButton: {
    backgroundColor: Colors.blue,
    paddingVertical: Spacings.md,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacings.xxs
  },
  validateButtonDisabled: {
    backgroundColor: Colors.gray,
    opacity: 0.5,
  },
  validateButtonText: {
    fontSize: 14,
    color: Colors.white,
    fontFamily: 'Poppins-Medium',
  },
});