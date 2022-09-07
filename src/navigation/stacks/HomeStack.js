import React from 'react'

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import  { HomeView }  from '../../views/home/HomeView';
import  SearchView  from '../../views/search/SearchView';
import { QaLayout } from '../../views/home/QaLayout';

import { ContentDisplayer } from "../../views/content/ContentDisplayer";
import { LessonEndingView } from '../../views/content/LessonEndingView';


const HomeStackNav = createNativeStackNavigator();
export const HomeStack = (user) => {
  return (
    <HomeStackNav.Navigator>
      <HomeStackNav.Screen
        name="home-home"
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
  );
}