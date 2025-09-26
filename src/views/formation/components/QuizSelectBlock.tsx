import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from "../../../../constants/Colors";
import Spacings from "../../../../constants/Spacings";

interface QuizSelectBlockProps {
  multiSelect: boolean;
  question: string;
  answers: string[];
  correctAnswers: number[];
}

const QuizSelectBlock: React.FC<QuizSelectBlockProps> = ({
  multiSelect,
  question,
  answers,
  correctAnswers
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [isValidated, setIsValidated] = useState(false);
  const [validationResult, setValidationResult] = useState<'correct' | 'incorrect' | null>(null);

  const handleAnswerSelect = (answerIndex: number) => {
    // Không cho phép chọn thêm nếu đã validated
    if (isValidated) return;

    if (multiSelect) {
      // Multi-select: toggle selection
      setSelectedAnswers(prev => {
        if (prev.includes(answerIndex)) {
          return prev.filter(index => index !== answerIndex);
        } else {
          return [...prev, answerIndex];
        }
      });
    } else {
      // Single select: replace selection
      setSelectedAnswers([answerIndex]);
    }
  };

  const checkAnswers = () => {
    // Không cho phép validate nếu chưa chọn gì
    if (selectedAnswers.length === 0) return;

    // Sort arrays
    const sortedSelected = [...selectedAnswers].sort();
    const sortedCorrect = [...correctAnswers].sort();

    // Check correct answers
    const isCorrect = sortedSelected.length === sortedCorrect.length &&
      sortedSelected.every((answer, index) => answer === sortedCorrect[index]);

    setIsValidated(true);
    setValidationResult(isCorrect ? 'correct' : 'incorrect');
  };

  const getAnswerStyle = (answerIndex: number) => {
    const isSelected = selectedAnswers.includes(answerIndex);
    const isCorrect = correctAnswers.includes(answerIndex);

    if (!isValidated) {
      // Chưa validate - hiển thị style bình thường
      if (isSelected) {
        return [styles.answerItem, styles.selectedAnswer];
      }
      return styles.answerItem;
    }

    // Đã validate - hiển thị kết quả
    if (isSelected && isCorrect) {
      // Chọn đúng -> màu xanh success
      return [styles.answerItem, styles.correctAnswer];
    } else if (isSelected && !isCorrect) {
      // Chọn sai -> màu đỏ danger
      return [styles.answerItem, styles.incorrectAnswer];
    } else if (!isSelected && isCorrect) {
      // Đáp án đúng nhưng chưa chọn -> highlight nhẹ
      return [styles.answerItem, styles.missedCorrectAnswer];
    }

    return styles.answerItem;
  };

  const getAnswerTextStyle = (answerIndex: number) => {
    const isSelected = selectedAnswers.includes(answerIndex);
    const isCorrect = correctAnswers.includes(answerIndex);

    if (!isValidated) {
      return isSelected ? styles.selectedAnswerText : styles.answerText;
    }

    // Đã validate
    if (isSelected && isCorrect) {
      return styles.correctAnswerText;
    } else if (isSelected && !isCorrect) {
      return styles.incorrectAnswerText;
    } else if (!isSelected && isCorrect) {
      return styles.missedCorrectAnswerText;
    }

    return styles.answerText;
  };

  const renderIcon = (answerIndex: number) => {
    const isSelected = selectedAnswers.includes(answerIndex);
    const isCorrect = correctAnswers.includes(answerIndex);

    if (isValidated) {
      // Hiển thị kết quả validation
      if (isSelected && isCorrect) {
        // Chọn đúng -> check mark
        return (
          <Ionicons
            name="checkmark-circle"
            size={24}
            color={Colors.success}
          />
        );
      } else if (isSelected && !isCorrect) {
        // Chọn sai -> X mark
        return (
          <Ionicons
            name="close-circle"
            size={24}
            color={Colors.danger}
          />
        );
      } else if (!isSelected && isCorrect) {
        // Đáp án đúng nhưng chưa chọn
        return (
          <Ionicons
            name="checkmark-circle-outline"
            size={24}
            color={Colors.success}
          />
        );
      }
    }

    // Chưa validate - hiển thị bình thường
    if (multiSelect) {
      return (
        <Ionicons
          name={isSelected ? "checkbox" : "square-outline"}
          size={24}
          color={isSelected ? Colors.info : Colors.gray}
        />
      );
    } else {
      return (
        <Ionicons
          name={isSelected ? "radio-button-on" : "radio-button-off"}
          size={24}
          color={isSelected ? Colors.info : Colors.gray}
        />
      );
    }
  };

  // Kiểm tra xem có nên hiển thị button Valider không
  const shouldShowValidateButton = !isValidated && selectedAnswers.length > 0;

  return (
    <View style={styles.container}>
      {/* Question */}
      <Text style={styles.question}>{question}</Text>

      {/* Answers */}
      <View style={styles.answersContainer}>
        {answers.map((answer, index) => (
          <TouchableOpacity
            key={index}
            style={getAnswerStyle(index)}
            onPress={() => handleAnswerSelect(index)}
            activeOpacity={isValidated ? 1 : 0.9}
            disabled={isValidated}
          >
            {/* Icon */}
            <View style={styles.iconContainer}>
              {renderIcon(index)}
            </View>

            {/* Answer text */}
            <Text style={getAnswerTextStyle(index)}>
              {answer}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Validation button - chỉ hiện khi chưa validate và đã chọn ít nhất 1 đáp án */}
      {shouldShowValidateButton && (
        <TouchableOpacity style={styles.btnCheck} onPress={checkAnswers}>
          <Text style={styles.btnCheckText}>Valider</Text>
        </TouchableOpacity>
      )}

      {/* Result message */}
      {isValidated && (
        <View style={styles.resultContainer}>
          <Text style={[
            styles.resultText,
            validationResult === 'correct' ? styles.correctResultText : styles.incorrectResultText
          ]}>
            {validationResult === 'correct' ? 'Bravo ! Bonne réponse' : 'Mauvaise réponse, essayez encore'}
          </Text>
        </View>
      )}
    </View>
  );
};

export default QuizSelectBlock;

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacings.xl,
    paddingHorizontal: Spacings.lg,
    backgroundColor: Colors.grayLight,
  },
  question: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: Spacings.md,
  },
  answersContainer: {
    gap: Spacings.sm,
  },
  answerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.md,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedAnswer: {
    backgroundColor: Colors.infoBackground,
    borderColor: Colors.info,
  },
  correctAnswer: {
    backgroundColor: Colors.successBackground,
    borderColor: Colors.success,
  },
  incorrectAnswer: {
    backgroundColor: Colors.dangerBackground,
    borderColor: Colors.danger,
  },
  missedCorrectAnswer: {
    backgroundColor: Colors.successBackground,
    borderColor: Colors.success,
    opacity: 0.6,
  },
  iconContainer: {
    marginRight: Spacings.sm,
  },
  answerText: {
    flex: 1,
    fontSize: 14,
    color: Colors.gray,
    lineHeight: 14,
  },
  selectedAnswerText: {
    color: Colors.info,
    paddingRight: Spacings.xl
  },
  correctAnswerText: {
    color: Colors.success,
    fontWeight: '500',
    paddingRight: Spacings.xl
  },
  incorrectAnswerText: {
    color: Colors.danger,
    fontWeight: '500',
    paddingRight: Spacings.xl
  },
  missedCorrectAnswerText: {
    color: Colors.success,
    fontWeight: '400',
    paddingRight: Spacings.xl
  },
  btnCheck: {
    backgroundColor: Colors.primaryLight,
    padding: Spacings.sm,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: Spacings.lg
  },
  btnCheckText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'Roboto',
    fontWeight: '500',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  resultContainer: {
    marginTop: Spacings.md,
    padding: Spacings.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  resultText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  correctResultText: {
    color: Colors.success,
  },
  incorrectResultText: {
    color: Colors.danger,
  },
});