import React from 'react'
import { createStackNavigator } from '@react-navigation/stack';

import { TrainingListView } from "../../views/training/TrainingListView";
import { TrainingView } from '../../views/training/TrainingView';


const TrainingStackNav = createStackNavigator()
export const TrainingStack = () => {
  return (
    <TrainingStackNav.Navigator
      id={"training-stack" as undefined}
      initialRouteName='training-list'
    >
      <TrainingStackNav.Screen
        name="training-list"
        component={TrainingListView}
        options={{
          headerShown: false,
        }}
      />
      <TrainingStackNav.Screen
        name="training"
        component={TrainingView}
        options={{
          headerShown: false,
        }}
      />
      
    </TrainingStackNav.Navigator>
  );
}