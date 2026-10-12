/** @author Francis */
import React from 'react'
import { Platform } from 'react-native';

import { createStackNavigator } from '@react-navigation/stack';

import { TrainingListView } from "../../views/training/TrainingListView";
import { InactiveTrainingView } from '../../views/training/InactiveTrainingView';
import { TrainingView } from '../../views/training/TrainingView';

import { LessonContentWithBlock } from '../../views/training/LessonContentWithBlock';
import { LessonContentWithXML } from "../../views/training/LessonContentWithXML";

import { CartView } from '../../views/training/CartView';
import { PreviewView } from '../../views/training/PreviewView';

import { BookingTabs } from './BookingTabs';

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
      screenOptions={{ title: 'Mes Formations' }} // for web
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
        options={
          Platform.OS === 'web'
            ? {
              headerShown: false,
              presentation: 'transparentModal',
              animation: 'slide_from_right',
            }
            : {
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
              }
            }
        }
      />
      <TrainingStackNav.Screen
        name="training-view"
        component={TrainingView}
        options={
          Platform.OS === 'web'
            ? {
              headerShown: false,
              presentation: 'transparentModal',
              animation: 'slide_from_right',
            }
            : {
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
          presentation: Platform.OS === 'web' ? 'transparentModal' : 'card',
          animation: 'slide_from_right',
        }}
      />

      <TrainingStackNav.Screen
        name="preview-view"
        component={PreviewView}
        options={{
          headerShown: false,
          presentation: Platform.OS === 'web' ? 'transparentModal' : 'card',
        }}
      />

      <TrainingStackNav.Screen
        name="lesson-content-block"
        component={LessonContentWithBlock}
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
        name="lesson-content-xml"
        component={LessonContentWithXML}
        options={
          Platform.OS === 'web'
            ? {
              headerShown: false,
              presentation: 'transparentModal',
              animation: 'fade_from_bottom',
            }
            : {
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
        name="booking"
        component={BookingTabs}
        options={{
          headerShown: false,
          presentation: Platform.OS === 'web' ? 'transparentModal' : 'card',
          animation: 'slide_from_right',
        }}
      />
    </TrainingStackNav.Navigator>
  );
}