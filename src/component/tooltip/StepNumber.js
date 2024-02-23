import React from "react";
import { Text, View } from "react-native";
import {
    useCopilot
  } from "react-native-copilot";


export const StepNumber = () => {
  const { currentStepNumber } = useCopilot();

  return (
    <View style={{}}>
      <Text style={{}}>{currentStepNumber}</Text>
    </View>
  );
};