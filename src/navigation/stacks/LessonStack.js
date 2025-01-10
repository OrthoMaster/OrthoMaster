import React from 'react'

import { createStackNavigator } from '@react-navigation/stack';

import { LessonsView } from "../../views/formation/LessonsView";
import { FormationView } from '../../views/formation/FormationView';
import { ModuleLayout } from '../../views/formation/ModuleLayout';

import { ContentDisplayer } from "../../views/content/ContentDisplayer";

import SearchView from '../../views/search/SearchView';

import { LessonEndingView } from '../../views/content/LessonEndingView';


const LessonStackNav = createStackNavigator();
export const LessonStack = () => {
  return (
      <LessonStackNav.Navigator
        initialRouteName='formation-home'
        screenOptions={{
          //animationTypeForReplace: 'pop',
          //headerShown: false,
          animationEnabled: false
        }}
      >
        <LessonStackNav.Screen
          name="formation-home"
          component={FormationView}
          options={{
            headerShown: false
          }}
        />
        <LessonStackNav.Screen
          name="formation-modules"
          component={ModuleLayout}
          options={{
            headerShown: false,
          }}
        />
        <LessonStackNav.Screen
          name="formation-lessons"
          component={LessonsView}
          options={{
            headerShown: false,
          }}
        />
        <LessonStackNav.Screen
          name="formation-search"
          component={SearchView}
          options={{
            headerShown: false
          }}
        />
        <LessonStackNav.Screen
          name="formation-content"
          component={ContentDisplayer}
          options={{
            headerShown: false
          }}
        />
        <LessonStackNav.Screen
          name="formation-content-result"
          component={LessonEndingView}
          options={{
            headerShown: false
          }}
        />
      </LessonStackNav.Navigator>
  );
}