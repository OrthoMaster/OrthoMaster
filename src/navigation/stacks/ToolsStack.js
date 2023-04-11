import React from 'react'


import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

import { ToolsView } from '../../views/tools/ToolsView';
import { QueChoisirView } from '../../views/tools/QueChoisir/QueChoisirView';


const ToolsStackNav = createNativeStackNavigator();

export const ToolsStack = ({navigation, route}) => {

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
        options={{ headerShown: false, title: 'Que choisir ?'}}
        
      />

    </ToolsStackNav.Navigator>
  );
}
