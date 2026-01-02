/** @author Francis */
import React from 'react'
import { createStackNavigator } from '@react-navigation/stack';

import { TrainingListView } from "../../views/training/TrainingListView";
import { InactiveTrainingView } from '../../views/training/InactiveTrainingView';
import { TrainingView } from '../../views/training/TrainingView';

import { LessonContent } from '../../views/training/LessonContent';

import { CartView } from '../../views/training/CartView';
import { PreviewView } from '../../views/training/PreviewView';

import { ContractView } from '../../views/contract/ContractView';


const forZoomFromCenter = ({ current, layouts }) => {
  return {
    cardStyle: {
      transform: [
        {
          scale: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.7, 1],
          }),
        },
      ],
      opacity: current.progress.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0.5, 1],
      }),
    },
  };
};

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
          animation: 'slide_from_left',
        }}
      />
      <TrainingStackNav.Screen
        name="inactive-training-view"
        component={InactiveTrainingView}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <TrainingStackNav.Screen
        name="training-view"
        component={TrainingView}
        options={{
          headerShown: false,
          cardStyleInterpolator: forZoomFromCenter,
          transitionSpec: {
            open: {
              animation: 'spring',
              config: {
                stiffness: 150,
                damping: 30,
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 350,
              },
            },
          },
        }}
      />

      <TrainingStackNav.Screen
        name="lesson-content"
        component={LessonContent}
        options={{
          headerShown: false,
          cardStyleInterpolator: forZoomFromCenter,
          transitionSpec: {
            open: {
              animation: 'spring',
              config: {
                stiffness: 150,
                damping: 30,
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 350,
              },
            },
          },
        }}
      />

      <TrainingStackNav.Screen
        name="cart-view"
        component={CartView}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      
      <TrainingStackNav.Screen
        name="preview-view"
        component={PreviewView}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <TrainingStackNav.Screen
        name="contract-view"
        component={ContractView}
        options={{
          headerShown: false,
        }}
      />

    </TrainingStackNav.Navigator>
  );
}