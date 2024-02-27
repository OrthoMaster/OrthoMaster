import React from "react";
import { Text, TouchableOpacity, View, Pressable } from "react-native";
import {
    useCopilot
  } from "react-native-copilot";

export const Tooltip = ({ labels }) => {
  const { goToNext, goToPrev, stop, currentStep, isFirstStep, isLastStep } =
    useCopilot();

  const handleStop = () => {
    void stop();
  };
  const handleNext = () => {
    void goToNext();
  };

  const handlePrev = () => {
    void goToPrev();
  };

  return (
    <View>
      <View style={{}}>
        <Text testID="stepDescription" style={{}}>
          {currentStep?.text}
        </Text>
      </View>
      <View style={[{}]}>
        {!isLastStep ? (
          <TouchableOpacity onPress={handleStop}>
            <Text>{labels.skip}</Text>
          </TouchableOpacity>
        ) : null}
        {!isFirstStep ? (
          <TouchableOpacity onPress={handlePrev}>
            <Text>{labels.previous}</Text>
          </TouchableOpacity>
        ) : null}
        {!isLastStep ? (
          <TouchableOpacity onPress={handleNext}>
            <Text>{labels.next}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleStop}>
            <Text>{labels.finish}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};