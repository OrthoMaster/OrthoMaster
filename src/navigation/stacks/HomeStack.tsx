import React from 'react';

import { Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';

import { HomeView } from '../../views/home/HomeView';
import { QaLayout } from '../../views/home/QaLayout';

import { ContentDisplayer } from "../../views/content/ContentDisplayer";
import { LessonEndingView } from '../../views/content/LessonEndingView';

import ReturnButtonIcon from '../components/ReturnButton';

import { NotificationView } from '../../views/notification/NotificationView';
import { LessonContentWithXML } from '../../views/training/LessonContentWithXML';
import { HomeSearchView } from '../../views/home/HomeSearchView';

import { InvoiceView } from '../../views/profile/InvoiceView';

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
      id={"home-stack" as undefined}
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