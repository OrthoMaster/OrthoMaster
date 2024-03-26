import React from 'react'


import { createStackNavigator } from '@react-navigation/stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

import { QueChoisirView } from '../../views/tools/QueChoisir/QueChoisirView';
// import { QueChoisirView } from '../../views/tools/QueChoisir/QueChoisirView';
import {FinalQC} from "../../views/tools/QueChoisir/FinalView/FinalQC";


const ToolsStackNav = createStackNavigator();

export const ToolsStack = ({navigation, route}) => {

  return (
    <ToolsStackNav.Navigator
      initialRouteName='tools-home'
    >
      <ToolsStackNav.Screen
        name="tools-home"
        component={QueChoisirView}
        options={{ headerShown: false }}
      />

      <ToolsStackNav.Screen
          name={'tools-que-choisir-final'}
          component={FinalQC}
          options={{ headerShown: false, title: 'Que choisir ?'}}
      />

    </ToolsStackNav.Navigator>
  );
}
