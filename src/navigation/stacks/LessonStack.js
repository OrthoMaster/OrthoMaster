import React from 'react'

import { LessonsView } from "../../views/formation/LessonsView";
import { FormationView } from '../../views/formation/FormationView';
import { ModuleLayout } from '../../views/formation/ModuleLayout';

import { ContentDisplayer } from "../../views/content/ContentDisplayer";
import ReturnButtonIcon from '../components/ReturnButton';
import SearchView from '../../views/search/SearchView';

import { LessonEndingView } from '../../views/content/LessonEndingView';
import { createStackNavigator } from '@react-navigation/stack';

import { LessonContent } from "../../views/formation/LessonContent";

const LessonStackNav = createStackNavigator()
export const LessonStack = () => {
  return (
    <LessonStackNav.Navigator
      initialRouteName='formation-home'
      screenOptions={{
        //animationTypeForReplace: 'pop',
        //headerShown: false,
        animationEnabled: true,
      }}
    >
      <LessonStackNav.Screen
        name="formation-home"
        component={FormationView}
        options={{
          headerShown: true,
          headerTitle: "Formations",
          headerStyle: {
            backgroundColor: "#8089D1"
          },
          headerTitleStyle: {
            color: '#fff',
            fontWeight: 'bold',
            fontSize: 20
          }
        }}
      />
      <LessonStackNav.Screen
        name="formation-modules"
        component={ModuleLayout}
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackButtonDisplayMode: "minimal",
          headerTintColor: '#000',
          headerStyle: {
            backgroundColor: "#8089D1",
          },
          headerTitleStyle:{
            marginLeft: 10,
            color: '#fff'
          },
          headerTitleAlign: "center",
          headerBackImage: ()=>(<ReturnButtonIcon />)
        }}
      />
      <LessonStackNav.Screen
        name="formation-lessons"
        component={LessonsView}
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackButtonDisplayMode: "minimal",
          headerTintColor: '#000',
          headerTransparent: true,
          headerBackImage: () => (<ReturnButtonIcon />)
        }}
      />
      <LessonStackNav.Screen
        name="formation-content"
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
      <LessonStackNav.Screen
        name="formation-content-result"
        component={LessonEndingView}
        options={{
          headerShown: false
        }}
      />
      <LessonStackNav.Screen
        name="lesson-content"
        component={LessonContent}
        options={{
          headerShown: false,
          headerTitle: "",
        }}
      />
    </LessonStackNav.Navigator>
  );
}