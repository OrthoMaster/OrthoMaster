import React from 'react'




import { ContentDisplayer } from "../../views/content/ContentDisplayer";
import ReturnButtonIcon from '../components/ReturnButton';

import { LessonEndingView } from '../../views/content/LessonEndingView';
import { createStackNavigator } from '@react-navigation/stack';


const ContentStackNav = createStackNavigator()
export const ContentStack = () => {
  return (
    <ContentStackNav.Navigator
      initialRouteName='content-main'
      screenOptions={{
        animationEnabled: true,
      }}
    >
      <ContentStackNav.Screen
        name="content-main"
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
      <ContentStackNav.Screen
        name="content-final"
        component={LessonEndingView}
        options={{
          headerShown: false
        }}
      />
    </ContentStackNav.Navigator>
  );
}