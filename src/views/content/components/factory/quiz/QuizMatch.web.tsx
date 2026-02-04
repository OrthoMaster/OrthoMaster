import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';

import { useSelector } from 'react-redux';
import { selectContent } from '../../../../../reducers/contentReducer';

import { getS3Image } from '../../../../../services/S3Service';

import Colors from "../../../../../../constants/Colors";
import Spacings from "../../../../../../constants/Spacings";

const buttonColor = [
  { index: 6, color: '#7D7D7D' },
  { index: 0, color: '#E27979' },
  { index: 1, color: '#FFAF31' },
  { index: 2, color: '#A8D065' },
  { index: 3, color: '#608DCA' },
  { index: 4, color: '#DC8DE2' },
  { index: 5, color: '#4BB6BE' },
];

const QuizFixedBox = ({ item, index }) => {
  return (
    <View
      style={[styles.questionListItem, {
        backgroundColor: buttonColor[index + 1].color,
      }]}
    >
      {item.children.length > 0 ? (
        <img
          src={item.children[0].attributes['s3']}
          alt="Quiz option"
          style={{
            objectFit: 'contain',
            height: 120,
            width: '100%',
          }}
        />
      ) : (
        <Text style={{ minHeight: 120 }}>{item?.value || 'txt'}</Text>
      )}
    </View>
  );
};

const QuizAnswerBox = ({ config, onColorChange, quizDone }) => {
  // const content = useSelector(selectContent);
  const [boxColorIndex, setBoxColorIndex] = useState(0);

  const handleClick = () => {
    if (quizDone) {
      return;
    }
    if (boxColorIndex == 6) {
      setBoxColorIndex(0);
    } else {
      setBoxColorIndex(boxColorIndex + 1);
    }
  };

  useEffect(() => {
    onColorChange({ ref: config.attributes.ref, color: buttonColor[boxColorIndex] });
  }, [boxColorIndex]);

  const isCorrect = quizDone && config.attributes.ref == boxColorIndex;
  const isWrong = quizDone && config.attributes.ref != boxColorIndex;

  return (
    <TouchableOpacity
      style={[styles.questionListItem, {
        backgroundColor: boxColorIndex == 0 ? '#ffffff' : buttonColor[boxColorIndex].color,
        borderColor: quizDone
          ? (isCorrect ? '#92D051' : '#ff0000')
          : buttonColor[boxColorIndex].color,
        borderWidth: quizDone ? 3 : 2,
      }]}
      onPress={handleClick}
      disabled={quizDone}
    >
      {config.children.length > 0 ? (
        <img
          src={config.children[0].attributes['s3']}
          alt="Quiz answer"
          style={{
            objectFit: 'contain',
            height: 120,
            width: '100%',
          }}
        />
      ) : (
        <Text style={{ minHeight: 120 }}>{config?.value || 'txt'}</Text>
      )}
    </TouchableOpacity>
  );
};

export const QuizMatch = ({ quizPossibilities, quizDone, quizAnswer, onSelect }) => {
  const [userResponse, setuserResponse] = useState(null);

  const handleUserAnswer = () => {
    let isOk = true;
    for (const [key, value] of Object.entries(userResponse)) {
      if (value.response) {
        if (value.color.index != value.response.color.index) {
          isOk = false;
          break;
        }
      } else {
        isOk = false;
        break;
      }
    }
    if (isOk) {
      onSelect(true);
    } else {
      onSelect(false);
    }
  };

  useEffect(() => {
    init();
  }, []);

  const init = () => {
    let newObject = {};
    quizPossibilities.forEach((element, index) => {
      newObject[element.attributes.ref] = {
        color: buttonColor[index + 1],
        response: null
      };
    });
    setuserResponse(newObject);
  };

  const updateResponse = (val) => {
    if (!userResponse) return;

    const newResponse = Object.keys(userResponse).slice().reduce((result, key) => {
      result[key] = userResponse[key];
      return result;
    }, {});
    newResponse[val.ref].response = val;
    setuserResponse(newResponse);
  };

  return (
    <View style={styles.container}>
      <View style={styles.answerContainer}>
        <View style={styles.receivingContainer}>
          {quizPossibilities.map((item, index) => (
            <QuizFixedBox key={index} item={item} index={index} />
          ))}
        </View>

        <View style={styles.receivingContainer}>
          {quizAnswer.map((item, index) => (
            <QuizAnswerBox
              key={index}
              quizDone={quizDone}
              config={item}
              onColorChange={(val) => updateResponse(val)}
            />
          ))}
        </View>
      </View>

      {!quizDone && (
        <TouchableOpacity style={styles.submitButton} onPress={handleUserAnswer}>
          <Text style={styles.submitButtonText}>Je valide !</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flex: 1,
  },
  answerContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacings.sm,
    width: '100%',
  },
  receivingContainer: {
    flex: 1,
    display: 'flex',
    gap: Spacings.xs,
    minWidth: 0,
  },
  questionListItem: {
    backgroundColor: '#fffefd',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacings.sm,
    borderRadius: 8,
    borderWidth: 2,
    minHeight: 120,
    cursor: 'pointer',
    width: '100%',
  },
  submitButton: {
    width: '100%',
    borderRadius: 50,
    backgroundColor: Colors.gray,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacings.md,
    paddingVertical: Spacings.xs,
    cursor: 'pointer',
    position: 'relative',
    zIndex: 10,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
});