import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, View, TouchableOpacity } from 'react-native';

import { QuizRadio } from './QuizRadio';
import { QuizNumber } from './QuizNumber';
import { QuizCheckbox } from './QuizCheckbox';
import { QuizMatch } from './QuizMatch';

import { Ionicons } from '@expo/vector-icons';

import Colors from "../../../../../../constants/Colors";
import Spacings from "../../../../../../constants/Spacings";

import CelebrationScreen from '../../../../animation/CelebrationScreen';

function getQuiz(content) {
  var quiz = {
    quizType: '',
    title: '',
    instruction: '',
    possibilities: [],
    answer: [],
    success: '',
    failure: ''
  };
  
  if (content.attributes['quiz-type']) {
    quiz.quizType = content.attributes['quiz-type'];
  }

  content.children.forEach(element => {
    switch (element.name) {
      case 'question':
        quiz.title = element.value;
        break;
      case 'instruction':
        quiz.instruction = element.value;
        break;
      case 'elem':
        quiz.possibilities.push(element);
        break;
      case 'answer':
        if (element.children.length > 0) {
          quiz.answer = element.children;
        } else {
          quiz.answer = element.value;
        }
        break;
      case 'success':
        quiz.success = element.value;
        break;
      case 'wrong':
        quiz.failure = element.value;
        break;
      default:
        break;
    }
  });
  return quiz;
}

function QuizAnswers({
  quizType,
  quizPossibilities,
  quizAnswer,
  quizDone,
  onCompleted,
  content
}) {
  const [userAnswer, setuserAnswer] = useState(null);
  
  useEffect(() => {
    if (userAnswer != null) {
      onCompleted(userAnswer);
    }
  }, [userAnswer]);

  switch (quizType) {
    case 'radio':
      return (
        <QuizRadio
          quizPossibilities={quizPossibilities}
          quizAnswer={quizAnswer}
          quizDone={quizDone}
          onSelect={(userAnswer) => setuserAnswer(userAnswer)}
        />
      );
    case 'number':
      return (
        <QuizNumber
          quizPossibilities={quizPossibilities}
          quizAnswer={quizAnswer}
          quizDone={quizDone}
          onSelect={(userAnswer) => setuserAnswer(userAnswer)}
        />
      );
    case 'checkbox':
      return (
        <QuizCheckbox
          quizPossibilities={quizPossibilities}
          quizAnswer={quizAnswer}
          quizDone={quizDone}
          onSelect={(userAnswer) => setuserAnswer(userAnswer)}
        />
      );
    case 'line':
      return (
        <QuizMatch
          quizPossibilities={quizPossibilities}
          quizAnswer={quizAnswer}
          quizDone={quizDone}
          onSelect={(userAnswer) => setuserAnswer(userAnswer)}
        />
      );
    default:
      return (<Text>(NO QUIZ)</Text>);
  }
}

export const QuizFactory = React.memo(({ content, isLast, quizId, onQuizCompleted }) => {
  const [quiz] = useState(() => getQuiz(content));
  const [quizDone, setQuizIsDone] = useState(null);
  const [quizStatus, setQuizStatus] = useState(false);

  const quizInsruction = () => {
    if (quiz.instruction != '') {
      return quiz.instruction;
    } else {
      switch (quiz.quizType) {
        case 'radio':
          return 'Selectionne LA bonne réponse';
        case 'checkbox':
          return 'Selectionne LA ou LES bonnes réponse(s)';
        case 'number':
          return 'Choisis le bon nombre';
        case 'line':
          return "Associe les paires ci-dessous en cliquant sur les propositions de droite jusqu'à trouver la bonne couleur";
        default:
          return '';
      }
    }
  };

  const [resetKey, setResetKey] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (quizDone && quizStatus) {
      onQuizCompleted?.(quizId, true);
    }
  }, [quizDone, quizStatus, quizId, onQuizCompleted]);

  const handleAfterAnswered = (status: boolean) => {
    setQuizIsDone(true);
    setShowCelebration(status);
    setQuizStatus(status ? true : false);
  };

  const resetAnswer = () => {
    setQuizIsDone(false);
    setResetKey(prev => prev + 1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.questionBox}>
        {quiz.title && <Text style={styles.questionSubtext}>Question</Text>}
        {quiz.title && <Text style={styles.questionText}>{quiz.title}</Text>}
      </View>

      <Text style={styles.instruction}>{quizInsruction()}</Text>
      
      <View style={styles.answerContainer}>
        <QuizAnswers
          key={resetKey}
          content={content}
          quizType={quiz.quizType}
          quizPossibilities={quiz.possibilities}
          quizAnswer={quiz.answer}
          quizDone={quizDone}
          onCompleted={(status) => {
            handleAfterAnswered(status);
          }}
        />

        {quizDone &&
          <Text style={[styles.statusQuizMessage, {
            color: quizStatus ? Colors.success : Colors.danger,
            fontSize: quizStatus ? 20 : 14
          }]}>
            {quizStatus ? 'Bravo !' : 'Dommage ...'}
          </Text>
        }
        
        {quizDone && !quizStatus &&
          <TouchableOpacity style={styles.resetButton} onPress={resetAnswer}>
            <Ionicons name="refresh" size={14} color={Colors.white} />
            <Text style={styles.resetButtonText}>Recommencer</Text>
          </TouchableOpacity>
        }
      </View>

      <CelebrationScreen
        visible={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacings.md,
    alignSelf: 'center',
    width: '100%',
  },
  questionBox: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: Spacings.md,
    paddingVertical: Spacings.md,
    backgroundColor: Colors.gray,
  },
  questionSubtext: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    paddingBottom: Spacings.xxs,
  },
  questionText: {
    color: Colors.white,
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
  },
  instruction: {
    fontSize: 14,
    color: Colors.subtext2,
    fontFamily: 'Roboto',
    fontStyle: 'italic',
    paddingHorizontal: Spacings.md,
    paddingTop: Spacings.md,
    backgroundColor: Colors.grayLight,
  },
  answerContainer: {
    padding: Spacings.md,
    backgroundColor: Colors.grayLight,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  statusQuizMessage: {
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    marginTop: Spacings.sm,
  },
  resetButton: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: 50,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacings.sm,
    paddingVertical: Spacings.xs,
    gap: Spacings.xxs,
    cursor: 'pointer',
  },
  resetButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
});