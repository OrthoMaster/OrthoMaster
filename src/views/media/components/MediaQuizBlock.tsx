/**
 * Quiz intégré à un contenu média.
 *
 * Reprend le déroulé de l'écran « Question du jour » : sélection, validation,
 * puis résultats et explication. La vidéo source n'y figure pas — elle est
 * déjà l'article que l'utilisateur est en train de lire.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import { answerDailyQuestion, getQuestionById } from '../../../services/v2/ContentService';
import CelebrationScreen from '../../animation/CelebrationScreen';

/** Couleurs d'accent des réponses, avant validation */
const ANSWER_ACCENTS = [Colors.blue, Colors.purple, Colors.primary, Colors.info];

/** Tranche inférieure de la carte, reprenant le bleu de l'en-tête */
const CARD_EDGE = '#1B4A7A';
const CARD_DEPTH = 7;

type Props = {
  questionId: number;
  /** Titre enregistré dans le bloc, affiché en attendant le chargement */
  fallbackTitle?: string;
};

/* -------------------------------------------------------------------------- */
/* Corps : monté seulement lorsque la question est disponible                  */
/* -------------------------------------------------------------------------- */

const QuizBody = ({ question, userAnswerId }: { question: any; userAnswerId: string | null }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(userAnswerId);
  const [showResults, setShowResults] = useState(!!userAnswerId);
  const [isLoading, setIsLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const queryClient = useQueryClient();

  const progressAnimations = useRef(
    question.answers.map(() => new Animated.Value(0))
  ).current;

  const feedbackAnim = useRef(new Animated.Value(0)).current;

  const selectedAnswerObj = question.answers.find(
    (answer: any) => answer.id === selectedAnswer
  );
  const isCorrect = !!selectedAnswerObj?.correct_flg;

  const calculatePercentage = (answer: any): number => {
    if (!showResults) {
      return answer.percentage || 0;
    }

    // +1 pour la réponse que l'utilisateur vient de donner
    const totalCount = question.count + 1;
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

  // Question déjà répondue : les résultats s'affichent d'emblée
  useEffect(() => {
    if (!userAnswerId || didRunInitialRef.current) return;
    didRunInitialRef.current = true;

    const timeout = setTimeout(() => runResultAnimations(true), 300);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!showResults || didRunInitialRef.current) return;
    didRunInitialRef.current = true;
    runResultAnimations(false);
  }, [showResults]);

  const handleAnswerPress = (answerId: string) => {
    if (showResults) return;
    setSelectedAnswer(answerId);
  };

  const handleValidate = async () => {
    if (!selectedAnswer || showResults) return;

    setShowResults(true);
    setIsLoading(true);

    if (selectedAnswerObj?.correct_flg) {
      setShowCelebration(true);
    }

    try {
      await answerDailyQuestion(question.id, selectedAnswer);
      queryClient.invalidateQueries({ queryKey: ['daily-action'] });
    } finally {
      setIsLoading(false);
    }
  };

  /** Couleurs d'une réponse selon son état */
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
      // La bonne réponse s'affiche en retrait lorsqu'elle n'a pas été choisie :
      // elle informe sans se substituer au verdict porté par la réponse donnée
      const wasChosen = answer.id === selectedAnswer;

      return {
        accent: Colors.success,
        borderColor: wasChosen ? Colors.success : Colors.success + '66',
        backgroundColor: wasChosen ? Colors.success + '12' : Colors.success + '08',
        chipBg: wasChosen ? Colors.success : Colors.success + '33',
        chipText: wasChosen ? Colors.white : Colors.success,
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

  const feedbackStyle = {
    opacity: feedbackAnim,
    transform: [
      {
        translateY: feedbackAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [30, 0],
        }),
      },
    ],
  };

  const footerBg = !showResults
    ? Colors.white
    : isCorrect
      ? Colors.successBackground
      : Colors.dangerBackground;

  return (
    <>
      <View style={styles.body}>
        <Text style={styles.questionText}>{question.question}</Text>

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

        {showResults && !!question.explanation && (
          <Animated.View style={[styles.resultWrapper, feedbackStyle]}>
            <View style={styles.resultBlock}>
              <Text style={styles.explanationText}>{question.explanation}</Text>
            </View>

            {/* L'explication est un apport de savoir, quel que soit le verdict :
                elle garde donc la même identité dans les deux cas */}
            <View style={styles.resultBadge}>
              <Ionicons name="bulb" size={18} color={Colors.white} />
              <Text style={styles.resultBadgeText}>Explication</Text>
            </View>
          </Animated.View>
        )}
      </View>

      <View style={styles.footer}>
        {!showResults && (
          <Pressable
            style={({ pressed }) => [
              styles.validateButton,
              (!selectedAnswer || isLoading) && styles.validateButtonDisabled,
              pressed && !!selectedAnswer && !isLoading && styles.buttonPressed,
            ]}
            onPress={handleValidate}
            disabled={!selectedAnswer || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.validateButtonText}>Valider</Text>
            )}
          </Pressable>
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
/* Bloc                                                                        */
/* -------------------------------------------------------------------------- */

export const MediaQuizBlock = ({ questionId, fallbackTitle }: Props) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['daily-question', String(questionId)],
    queryFn: () => getQuestionById(questionId),
    enabled: !!questionId,
    retry: 2,
    retryDelay: 2000,
  });

  const question = data?.question ?? null;
  const userAnswerId = data?.user_answer_id ?? null;

  // Contenu supprimé côté administration : le bloc disparaît
  if (!isLoading && !question && !isError) return null;

  return (
    <View style={styles.card}>
      <View style={styles.cardInner}>
        <LinearGradient
          colors={[Colors.blueDark, Colors.blue]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerIconWrap}>
            <MaterialIcons name="quiz" size={22} color={Colors.white} />
          </View>

          <Text style={styles.headerTitle} numberOfLines={2}>
            {question?.title ?? fallbackTitle ?? 'Question'}
          </Text>
        </LinearGradient>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.blue} />
          </View>
        ) : !question ? (
          <View style={styles.centered}>
            <Ionicons name="help-circle-outline" size={40} color={Colors.gray} />
            <Text style={styles.emptyText}>Cette question n'est pas disponible.</Text>
          </View>
        ) : (
          <QuizBody question={question} userAnswerId={userAnswerId} />
        )}
      </View>
    </View>
  );
};

export default MediaQuizBlock;

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    paddingBottom: CARD_DEPTH,
    backgroundColor: CARD_EDGE,
    shadowColor: CARD_EDGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  cardInner: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: Colors.blue3,
    borderWidth: 1,
    borderColor: Colors.blueDark,
  },
  centered: {
    paddingVertical: Spacings.xxl,
    alignItems: 'center',
    gap: Spacings.sm,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    textAlign: 'center',
  },

  /* ---- En-tête ---- */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    paddingHorizontal: Spacings.md,
    paddingVertical: Spacings.md,
  },
  headerIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    color: Colors.white,
    fontFamily: 'Poppins-Bold',
  },

  /* ---- Corps ---- */
  body: {
    paddingTop: Spacings.lg,
  },
  questionText: {
    paddingHorizontal: Spacings.md,
    marginBottom: Spacings.lg,
    fontSize: 17,
    color: Colors.text,
    lineHeight: 25,
    fontFamily: 'Poppins-Bold',
  },

  /* ---- Réponses ---- */
  answersContainer: {
    paddingHorizontal: Spacings.md,
    gap: Spacings.sm,
  },
  answerCard: {
    borderRadius: 18,
    paddingHorizontal: Spacings.md,
    paddingTop: Spacings.sm,
    paddingBottom: Spacings.md,
    borderWidth: 2,
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

  /* ---- Explication ---- */
  resultWrapper: {
    marginHorizontal: Spacings.md,
    marginTop: Spacings.xl,
    paddingTop: 18,
  },
  resultBlock: {
    padding: Spacings.md,
    paddingTop: Spacings.xl,
    borderRadius: 18,
    backgroundColor: Colors.successBackground,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 2,
    borderColor: Colors.success
  },
  resultBadge: {
    position: 'absolute',
    top: 0,
    left: Spacings.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: Spacings.md,
    borderRadius: 18,
    backgroundColor: Colors.success,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  resultBadgeText: {
    fontSize: 14,
    color: Colors.white,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 0.4,
  },
  explanationText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
    textAlign: 'justify',
  },

  /* ---- Pied ---- */
  footer: {
    paddingHorizontal: Spacings.md,
    paddingTop: Spacings.lg,
    paddingBottom: Spacings.md,
  },
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
});