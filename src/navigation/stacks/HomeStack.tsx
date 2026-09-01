import React from 'react';

import { Platform } from 'react-native';
import { createStackNavigator, TransitionSpecs } from '@react-navigation/stack';
import { Animated } from 'react-native';

import { HomeView } from '../../views/home/HomeView';
import { QaLayout } from '../../views/home/QaLayout';

import { PodcastPlayerView } from '../../views/podcast/PodcastPlayerView';
import { DailyQuestionView } from '../../views/question/DailyQuestionView';
import { InfographicView } from '../../views/infographic/InfographicView';

import { ContentDisplayer } from "../../views/content/ContentDisplayer";
import { LessonEndingView } from '../../views/content/LessonEndingView';

import ReturnButtonIcon from '../components/ReturnButton';

import { NotificationView } from '../../views/notification/NotificationView';
import { LessonContentWithXML } from '../../views/training/LessonContentWithXML';
import { HomeSearchView } from '../../views/home/HomeSearchView';

import { InvoiceView } from '../../views/profile/InvoiceView';

import Colors from '../../../constants/Colors';

const slideUpOnClose = ({ current, closing, layouts }) => {
  const { height } = layouts.screen;

  // mở: từ dưới lên
  const enter = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0],
    extrapolate: 'clamp',
  });

  // đóng: trượt tiếp lên trên
  const exit = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-height, 0],
    extrapolate: 'clamp',
  });

  const translateY = Animated.add(
    Animated.multiply(Animated.subtract(1, closing), enter),
    Animated.multiply(closing, exit)
  );

  return {
    cardStyle: {
      transform: [{ translateY }],
      opacity: current.progress.interpolate({
        inputRange: [0, 0.4, 1],
        outputRange: [0, 1, 1],
        extrapolate: 'clamp',
      }),
    },
  };
};

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

const HomeStackNav = createStackNavigator();
export const HomeStack = () => {
  return (
    <HomeStackNav.Navigator
      id={"home-stack"}
      initialRouteName='home'
      screenOptions={{ title: 'Accueil' }} // for web
    >
      <HomeStackNav.Screen
        name={"home"}
        component={HomeView}
        options={{
          headerShown: false
        }}
      />

      <HomeStackNav.Screen
        name="podcast"
        component={PodcastPlayerView}
        options={{
          headerShown: false,
          gestureEnabled: false,
          cardStyleInterpolator: slideUpOnClose,
          transitionSpec: {
            open: TransitionSpecs.TransitionIOSSpec,
            close: TransitionSpecs.TransitionIOSSpec,
          },
          cardStyle: { backgroundColor: Colors.blackBackground },
          cardOverlayEnabled: false,
        }}
      />

      <HomeStackNav.Screen
        name="infographic"
        component={InfographicView}
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

      <HomeStackNav.Screen
        name="daily-question"
        component={DailyQuestionView}
        options={{
          headerShown: false,
          gestureEnabled: false,
          presentation: 'transparentModal',
          cardStyle: { backgroundColor: 'transparent' },
          cardStyleInterpolator: slideUpOnClose,
          transitionSpec: {
            open: TransitionSpecs.TransitionIOSSpec,
            close: TransitionSpecs.TransitionIOSSpec,
          },
          cardOverlayEnabled: false,
        }}
      />

      <HomeStackNav.Screen
        name="home-content"
        component={ContentDisplayer}
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackButtonDisplayMode: "minimal",
          headerTintColor: '#000',
          headerTransparent: true,
          headerBackImage: () => (<ReturnButtonIcon />)
        }}
      />
      <HomeStackNav.Screen
        name="home-content-result"
        component={LessonEndingView}
        options={{
          headerShown: false
        }}
      />
      <HomeStackNav.Screen
        name="home-qa"
        component={QaLayout}
        options={{
          title: 'Question / Réponse',
          headerTitleStyle: {
            fontSize: 22
          },
        }}
      />

      <HomeStackNav.Screen
        name="notification-list"
        component={NotificationView}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          presentation: Platform.OS === 'web' ? 'transparentModal' : 'card',
        }}
      />
      <HomeStackNav.Screen
        name="home-search"
        component={HomeSearchView}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          presentation: Platform.OS === 'web' ? 'transparentModal' : 'card',
        }}
      />

      <HomeStackNav.Screen
        name="lesson-content-xml"
        component={LessonContentWithXML}
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

      <HomeStackNav.Screen
        name="invoice-view"
        component={InvoiceView}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />

    </HomeStackNav.Navigator>
  );
}