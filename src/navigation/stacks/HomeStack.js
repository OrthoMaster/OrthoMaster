import React from 'react'

import { createStackNavigator } from '@react-navigation/stack';

import { HomeView } from '../../views/home/HomeView';
import SearchView from '../../views/search/SearchView';
import { QaLayout } from '../../views/home/QaLayout';

import { ContentDisplayer } from "../../views/content/ContentDisplayer";
import { LessonEndingView } from '../../views/content/LessonEndingView';
import {
  CopilotProvider
} from "react-native-copilot";
import { StepNumber } from '../../component/tooltip/StepNumber';
import { Tooltip } from '../../component/tooltip/Tooltip';

const HomeStackNav = createStackNavigator();


export const HomeStack = (user) => {

  return (
    <CopilotProvider overlay='svg' tooltipComponent={Tooltip} stepNumberComponent={StepNumber}>
      <HomeStackNav.Navigator>
        <HomeStackNav.Screen
          name={"home-home"}
          component={HomeView}
          options={{
            headerShown: false
          }}
        />

        <HomeStackNav.Screen
          name="home-search"
          component={SearchView}
          options={{
            headerShown: false
          }}
        />
        <HomeStackNav.Screen
          name="home-content"
          component={ContentDisplayer}
          options={{
            headerShown: false
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
            headerBackTitleVisible: false,
          }}
        />
      </HomeStackNav.Navigator>
    </CopilotProvider>
  );
}