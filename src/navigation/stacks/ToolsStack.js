import React from 'react'


import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ToolsView } from '../../views/tools/ToolsView';
import { QueChoisirView } from '../../views/tools/QueChoisir/QueChoisirView';


const ToolsStackNav = createNativeStackNavigator();

export const ToolsStack = () => {
  return (
    <ToolsStackNav.Navigator
      initialRouteName='tools-home'
    >
      <ToolsStackNav.Screen
        name="tools-home"
        component={ToolsView}
        options={{ headerShown: false }}
      />
      <ToolsStackNav.Screen
        name="tools-que-choisir"
        component={QueChoisirView}
        options={{ headerShown: true, title: 'Que choisir ?'}}
      />

    </ToolsStackNav.Navigator>
  );
}
