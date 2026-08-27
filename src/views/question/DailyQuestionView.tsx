import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Animated,
  ScrollView,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { useFocusEffect, CommonActions } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import SourceVideoCard from '../podcast/components/SourceVideoCard';

import { answerDailyQuestion, getQuestionById } from '../../services/v2/ContentService';
import { addTopic } from '../../services/v2/AuthService';
import CelebrationScreen from '../animation/CelebrationScreen';

const { width, height } = Dimensions.get('window');

/** Màu nhấn xoay vòng cho từng đáp án khi chưa trả lời */
const ANSWER_ACCENTS = [Colors.blue, Colors.purple, Colors.primary, Colors.info];

/* -------------------------------------------------------------------------- */
/* Body: chỉ mount khi đã chắc chắn có question                               */
/* (progressAnimations khởi tạo từ answers nên không thể render khi chưa có)   */
/* -------------------------------------------------------------------------- */

interface QuestionBodyProps {
  question: any;
  userAnswerId: string | null;
  hasTopicQuestion: boolean;
  onAnswered: () => void;
  onOpenVideo: () => void;
}

const QuestionBody: React.FC<QuestionBodyProps> = ({
  question,
  userAnswerId,
  hasTopicQuestion,
  onAnswered,
  onOpenVideo,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(userAnswerId);
  const [showResults, setShowResults] = useState(!!userAnswerId);
  const [isLoading, setIsLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [subscribed, setSubscribed] = useState<boolean>(hasTopicQuestion);

  const queryClient = useQueryClient();

  const video = question.content ?? null;

  const progressAnimations = useRef(
    question.answers.map(() => new Animated.Value(0))
  ).current;

  // Khối kết quả (explication + vidéo) trượt lên trong vùng cuộn
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  /**
   * Sau khi kết quả xuất hiện, tự cuộn xuống để user thấy explication + vidéo.
   * Cờ được bật đồng bộ (không nằm trong effect) để không lỡ mất
   * lần onContentSizeChange đầu tiên.
   */
  const scrollRef = useRef<ScrollView>(null);
  const shouldScrollRef = useRef(!!userAnswerId);

  const handleContentSizeChange = () => {
    if (!shouldScrollRef.current) return;
    shouldScrollRef.current = false;
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
  };

  const selectedAnswerObj = question.answers.find(
    (answer: any) => answer.id === selectedAnswer
  );
  const isCorrect = !!selectedAnswerObj?.correct_flg;

  const calculatePercentage = (answer: any): number => {
    if (!showResults) {
      return answer.percentage || 0;
    }

    const totalCount = question.count + 1; // +1 cho câu trả lời của user hiện tại
    const answerCount = answer.id === selectedAnswer ? answer.count + 1 : answer.count;

    return Math.round((answerCount / totalCount) * 100);
  };

  const runResultAnimations = (isInitial: boolean) => {
    const progressSequence = question.answers.map((answer: any, index: number) =>
      Animated.timing(progressAnimations[index], {
        toValue: calculatePercentage(answer),
        duration: 700,
        delay: index * 80,
        useNativeDriver: false,
      })
    );

    Animated.parallel([
      ...progressSequence,
      Animated.spring(feedbackAnim, {
        toValue: 1,
        delay: isInitial ? 200 : 120,
        tension: 60,
        friction: 9,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const didRunInitialRef = useRef(false);

  // User đã trả lời từ trước -> chạy animation kết quả ngay khi vào
  useEffect(() => {
    if (!userAnswerId || didRunInitialRef.current) return;
    didRunInitialRef.current = true;

    const timeout = setTimeout(() => runResultAnimations(true), 300);
    return () => clearTimeout(timeout);
  }, []);

  // User vừa trả lời trong màn hình này
  useEffect(() => {
    if (!showResults || didRunInitialRef.current) return;
    didRunInitialRef.current = true;
    runResultAnimations(false);
  }, [showResults]);

  const handleAnswerPress = (answerId: string) => {
    if (showResults) return;
    setSelectedAnswer(answerId);
  };

  /** Theo dõi sujet. Không đóng modal: user còn explication + vidéo để xem */
  const handleSubscribeTopic = async () => {
    if (subscribed || isLoading) return;

    setIsLoading(true);
    setSubscribed(true);

    try {
      await addTopic(question.topic.id);
      await queryClient.invalidateQueries({ queryKey: ['current-user'] });
      await queryClient.invalidateQueries({ queryKey: ['daily-action'] });
    } catch (error) {
      setSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!selectedAnswer || showResults) return;

    shouldScrollRef.current = true;
    setShowResults(true);
    setIsLoading(true);

    if (selectedAnswerObj?.correct_flg) {
      setShowCelebration(true);
    }

    try {
      await answerDailyQuestion(question.id, selectedAnswer);
      onAnswered();
    } finally {
      setIsLoading(false);
    }
  };

  /** Màu của 1 đáp án theo trạng thái */
  const getAnswerVisual = (answer: any, index: number) => {
    const accent = ANSWER_ACCENTS[index % ANSWER_ACCENTS.length];

    if (!showResults) {
      const isSelected = answer.id === selectedAnswer;
      return {
        accent,
        borderColor: isSelected ? accent : Colors.line,
        backgroundColor: isSelected ? accent + '14' : Colors.white,
        chipBg: isSelected ? accent : accent + '1A',
        chipText: isSelected ? Colors.white : accent,
        textColor: Colors.text,
        dimmed: false,
      };
    }

    if (answer.correct_flg) {
      return {
        accent: Colors.success,
        borderColor: Colors.success,
        backgroundColor: Colors.success + '12',
        chipBg: Colors.success,
        chipText: Colors.white,
        textColor: Colors.text,
        dimmed: false,
      };
    }

    if (answer.id === selectedAnswer) {
      return {
        accent: Colors.danger,
        borderColor: Colors.danger,
        backgroundColor: Colors.danger + '12',
        chipBg: Colors.danger,
        chipText: Colors.white,
        textColor: Colors.text,
        dimmed: false,
      };
    }

    return {
      accent: Colors.gray,
      borderColor: Colors.line,
      backgroundColor: Colors.white,
      chipBg: Colors.grayLight,
      chipText: Colors.gray,
      textColor: Colors.gray,
      dimmed: true,
    };
  };

  const isValidateDisabled = !selectedAnswer;

  /** Nền footer đổi theo kết quả */
  const footerBg = !showResults
    ? Colors.white
    : isCorrect
      ? Colors.successBackground
      : Colors.dangerBackground;

  const feedbackStyle = {
    opacity: feedbackAnim,
    transform: [
      {
        translateY: feedbackAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [40, 0],
        }),
      },
    ],
  };

  const verdictStyle = {
    opacity: feedbackAnim,
  };

  return (
    <>
      <View style={styles.contentWrapper}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={handleContentSizeChange}
        >
          {/* Câu hỏi */}
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>{question.question}</Text>
          </View>

          {/* Đáp án */}
          <View style={styles.answersContainer}>
            {question.answers.map((answer: any, index: number) => {
              const visual = getAnswerVisual(answer, index);
              const displayPercentage = calculatePercentage(answer);

              return (
                <Pressable
                  key={answer.id}
                  onPress={() => handleAnswerPress(answer.id)}
                  disabled={showResults}
                  style={({ pressed }) => [
                    styles.answerCard,
                    {
                      borderColor: visual.borderColor,
                      backgroundColor: visual.backgroundColor,
                      borderBottomColor: visual.borderColor,
                      opacity: visual.dimmed ? 0.65 : 1,
                    },
                    pressed && !showResults && styles.answerCardPressed,
                  ]}
                >
                  <View style={styles.answerRow}>
                    <View style={[styles.letterChip, { backgroundColor: visual.chipBg }]}>
                      <Text style={[styles.letterChipText, { color: visual.chipText }]}>
                        {String.fromCharCode(65 + index)}
                      </Text>
                    </View>

                    <Text style={[styles.answerText, { color: visual.textColor }]}>
                      {answer.text}
                    </Text>

                    {showResults && (answer.correct_flg || answer.id === selectedAnswer) && (
                      <Ionicons
                        name={answer.correct_flg ? 'checkmark-circle' : 'close-circle'}
                        size={24}
                        color={answer.correct_flg ? Colors.success : Colors.danger}
                      />
                    )}
                  </View>

                  {/* Tỉ lệ chọn */}
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
                              backgroundColor: visual.accent,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.percentageText, { color: visual.accent }]}>
                        {displayPercentage}%
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Khối kết quả: explication + vidéo source. Cuộn tự do, không giới hạn chiều cao */}
          {showResults && (
            <Animated.View style={[styles.resultBlock, feedbackStyle]}>
              {!!question.explanation && (
                <>
                  <View style={styles.resultLabelRow}>
                    <View
                      style={[
                        styles.resultLabelBar,
                        { backgroundColor: isCorrect ? Colors.success : Colors.danger },
                      ]}
                    />
                    <Text style={styles.resultLabel}>Explication</Text>
                  </View>
                  <Text style={styles.explanationText}>{question.explanation}</Text>
                </>
              )}

              {!!video && (
                <View style={!!question.explanation && styles.videoSpacing}>
                  <SourceVideoCard
                    variant="large"
                    video={video}
                    label={isCorrect ? 'Pour aller plus loin' : 'Comprendre la réponse'}
                    onPress={onOpenVideo}
                  />
                </View>
              )}
            </Animated.View>
          )}

          <View style={{ height: Spacings.md }} />
        </ScrollView>
      </View>

      {/* Footer: trước khi trả lời = CTA Valider. Sau đó = verdict + bouton Suivre */}
      <View style={[styles.footer, { backgroundColor: footerBg }]}>
        {/* Dải chuyển màu nối vùng cuộn xuống footer */}
        <LinearGradient
          colors={['rgba(255,255,255,0)', footerBg]}
          style={styles.footerFade}
          pointerEvents="none"
        />

        {!showResults ? (
          <Pressable
            style={({ pressed }) => [
              styles.validateButton,
              (isValidateDisabled || isLoading) && styles.validateButtonDisabled,
              pressed && !isValidateDisabled && !isLoading && styles.buttonPressed,
            ]}
            onPress={handleValidate}
            disabled={isValidateDisabled || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.validateButtonText}>Valider</Text>
            )}
          </Pressable>
        ) : (
          <Animated.View style={[styles.resultFooterRow, verdictStyle]}>
            <View style={[styles.verdictRow, subscribed && styles.verdictRowCentered]}>
              <View
                style={[
                  styles.feedbackIconWrap,
                  { backgroundColor: isCorrect ? Colors.success : Colors.danger },
                ]}
              >
                <Ionicons
                  name={isCorrect ? 'checkmark-sharp' : 'close-sharp'}
                  size={16}
                  color={Colors.white}
                />
              </View>
              <Text
                style={[
                  styles.feedbackTitle,
                  { color: isCorrect ? Colors.success : Colors.danger },
                ]}
                numberOfLines={1}
              >
                {isCorrect ? 'Bonne réponse !' : 'Pas tout à fait'}
              </Text>
            </View>

            {!subscribed && (
              <Pressable
                style={({ pressed }) => [
                  styles.followButton,
                  isLoading && styles.followButtonLoading,
                  pressed && !isLoading && styles.buttonPressed,
                ]}
                onPress={handleSubscribeTopic}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel={`Suivre le sujet ${question.topic?.name ?? ''}`}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Ionicons name="notifications" size={16} color={Colors.white} />
                    <Text style={styles.followButtonText}>Suivre</Text>
                  </>
                )}
              </Pressable>
            )}
          </Animated.View>
        )}
      </View>

      <CelebrationScreen
        visible={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />
    </>
  );
};

/* -------------------------------------------------------------------------- */
/* Screen                                                                      */
/* -------------------------------------------------------------------------- */

export const DailyQuestionView = ({ navigation, route }) => {
  const questionId = route.params?.questionId ?? null;

  const {
    data,
    isLoading: isLoadingQuestion,
    isError: isErrorQuestion,
    refetch: refetchQuestion,
  } = useQuery({
    queryKey: ['daily-question', String(questionId)],
    queryFn: () => getQuestionById(questionId),
    enabled: !!questionId,
    retry: 2,
    retryDelay: 2000,
  });

  const question = data?.question ?? null;
  const userAnswerId = data?.user_answer_id ?? null;
  const hasTopicQuestion = !!data?.has_topic;
  const video = question?.content ?? null;
  const topicName = question?.topic?.name ?? null;

  const queryClient = useQueryClient();

  // Animation của card
  const animation = useRef(new Animated.Value(0)).current;
  const isClosingRef = useRef(false);

  useEffect(() => {
    Animated.spring(animation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, []);

  /**
   * HomeView cũ refetch daily-action khi đóng nếu user chưa trả lời.
   * Screen tự lo: đánh dấu rồi invalidate lúc unmount.
   */
  const answeredRef = useRef(false);
  useEffect(() => {
    return () => {
      if (answeredRef.current) {
        queryClient.invalidateQueries({ queryKey: ['daily-action'] });
      }
    };
  }, []);

  const goBackSafe = () => {
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

  const handleClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    Animated.timing(animation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => goBackSafe());
  };

  /**
   * Mở video gốc. Không đóng modal: user back về là thấy lại kết quả.
   */
  const handleOpenVideo = () => {
    if (!video?.id_content) return;
    navigation.navigate('media', {
      screen: 'flash-media-preview',
      params: { media: video },
    });
  };

  // Ẩn tab bar khi screen focus, trả lại khi rời đi
  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      parent?.setOptions({ tabBarStyle: { display: 'none' } });

      return () => {
        parent?.setOptions({ tabBarStyle: undefined });
      };
    }, [navigation])
  );

  // Android back -> chạy animation đóng thay vì nhảy cụp
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        handleClose();
        return true;
      });
      return () => sub.remove();
    }, [])
  );

  const cardStyle = {
    transform: [
      {
        scale: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1],
        }),
      },
    ],
    opacity: animation,
  };

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.backdrop, { opacity: animation }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      <Animated.View style={[styles.modalContainer, cardStyle]}>
        <LinearGradient
          colors={[Colors.blueDark, Colors.blue]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerIconWrap}>
              <MaterialIcons name="quiz" size={25} color={Colors.white} />
            </View>

            <View style={styles.headerTexts}>
              <Text style={styles.headerTitle} numberOfLines={2}>
                {question?.title ?? 'Question du jour'}
              </Text>

              {!!topicName && (
                <View style={styles.headerTopicPill}>
                  <Text style={styles.headerTopicText} numberOfLines={1}>
                    {topicName}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <Pressable onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={25} color={Colors.white} />
          </Pressable>
        </LinearGradient>

        {isLoadingQuestion ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.blue} />
          </View>
        ) : !question ? (
          <View style={styles.centered}>
            <Ionicons name="help-circle-outline" size={48} color={Colors.gray} />
            <Text style={styles.emptyText}>Cette question n'est plus disponible.</Text>
            {isErrorQuestion && (
              <Pressable onPress={() => refetchQuestion()} style={styles.retryButton}>
                <Text style={styles.retryText}>Réessayer</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <QuestionBody
            question={question}
            userAnswerId={userAnswerId}
            hasTopicQuestion={hasTopicQuestion}
            onAnswered={() => { answeredRef.current = true; }}
            onOpenVideo={handleOpenVideo}
          />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  modalContainer: {
    width: width * 0.92,
    maxWidth: 520,
    height: height * 0.82,
    backgroundColor: Colors.white,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacings.md,
    paddingHorizontal: Spacings.lg,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacings.sm,
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.blue,
  },
  retryText: {
    color: Colors.blue,
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
  },

  /* ---- Header ---- */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.md,
    paddingBottom: Spacings.md,
    gap: Spacings.sm,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
  },
  headerIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTexts: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 17,
    color: Colors.white,
    fontFamily: 'Poppins-Bold',
  },
  headerTopicPill: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    marginTop: 5,
    paddingHorizontal: Spacings.sm,
    paddingVertical: 2,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  headerTopicText: {
    fontSize: 11,
    color: Colors.white,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.3,
    opacity: 0.95,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ---- Question ---- */
  contentWrapper: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacings.sm,
  },
  questionContainer: {
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.lg,
    paddingBottom: Spacings.lg,
  },
  questionText: {
    fontSize: 18,
    color: Colors.text,
    lineHeight: 27,
    fontFamily: 'Poppins-Bold',
  },

  /* ---- Answers ---- */
  answersContainer: {
    paddingHorizontal: Spacings.lg,
    gap: Spacings.sm,
  },
  answerCard: {
    borderRadius: 18,
    paddingHorizontal: Spacings.md,
    paddingTop: Spacings.sm,
    paddingBottom: Spacings.md,
    borderWidth: 2,
    // hiệu ứng nổi kiểu Duolingo
    borderBottomWidth: 5,
  },
  answerCardPressed: {
    borderBottomWidth: 2,
    marginTop: 3,
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
  },
  letterChip: {
    width: 34,
    height: 34,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  letterChipText: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
  },
  answerText: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    lineHeight: 21,
  },
  statsContainer: {
    marginTop: Spacings.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.07)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  percentageText: {
    fontSize: 12,
    width: 42,
    textAlign: 'right',
    fontFamily: 'Poppins-Bold',
  },

  /* ---- Khối kết quả trong vùng cuộn ---- */
  resultBlock: {
    marginHorizontal: Spacings.lg,
    marginTop: Spacings.lg,
    padding: Spacings.md,
    borderRadius: 18,
    backgroundColor: Colors.grayLight,
  },
  resultLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    marginBottom: Spacings.xs,
  },
  resultLabelBar: {
    width: 3,
    height: 13,
    borderRadius: 2,
  },
  resultLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
    color: Colors.gray,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  explanationText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
    textAlign: 'justify',
  },
  videoSpacing: {
    marginTop: Spacings.md,
  },

  /* ---- Footer ---- */
  footer: {
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.md,
    paddingBottom: Spacings.lg,
  },
  footerFade: {
    position: 'absolute',
    top: -28,
    left: 0,
    right: 0,
    height: 28,
  },
  resultFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    minHeight: 40,
  },
  verdictRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  verdictRowCentered: {
    justifyContent: 'center',
  },
  feedbackIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackTitle: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
  },

  /* ---- Boutons ---- */
  buttonPressed: {
    borderBottomWidth: 2,
    marginTop: 3,
  },
  validateButton: {
    paddingVertical: Spacings.md,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.blue,
    borderBottomWidth: 5,
    borderBottomColor: 'rgba(0, 0, 0, 0.22)',
  },
  validateButtonDisabled: {
    backgroundColor: Colors.gray,
    opacity: 0.45,
    borderBottomColor: 'rgba(0, 0, 0, 0.12)',
  },
  validateButtonText: {
    fontSize: 15,
    color: Colors.white,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 0.3,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.xxs,
    minWidth: 104,
    paddingHorizontal: Spacings.md,
    paddingVertical: Spacings.xs,
    borderRadius: 14,
    backgroundColor: Colors.blue,
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(0, 0, 0, 0.22)',
  },
  followButtonLoading: {
    opacity: 0.7,
  },
  followButtonText: {
    fontSize: 14,
    color: Colors.white,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 0.2,
  },
});

export default DailyQuestionView;