import React from 'react'


import { createStackNavigator } from '@react-navigation/stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

import { ToolsView } from '../../views/tools/ToolsView';
import { QueChoisirView } from '../../views/tools/components/QueChoisir/View/QueChoisirView';
import {FinalQC} from "../../views/tools/components/QueChoisir/FinalView/FinalQC";
import { ContentDisplayer } from '../../views/content/ContentDisplayer';
import ReturnButtonIcon from '../components/ReturnButton';

const ToolsStackNav = createStackNavigator();

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
        name="tools-content"
        component={ContentDisplayer}
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackButtonDisplayMode: "minimal",
          headerTintColor: '#000',
          headerTransparent: true,
          headerBackImage: ()=>(<ReturnButtonIcon />)
        }}
      />
      <ToolsStackNav.Screen
        name="tools-que-choisir"
        component={QueChoisirView}
        options={{ 
          headerShown: true,
          headerTitle: "",
          headerBackButtonDisplayMode: "minimal",
          headerTintColor: '#000',
          headerTransparent: true,
          headerBackImage: ()=>(<ReturnButtonIcon />)
        }}
        
      />

      <ToolsStackNav.Screen
          name={'tools-que-choisir-final'}
          component={FinalQC}
          options={{ headerShown: false, title: 'Que choisir ?'}}
      />

    </ToolsStackNav.Navigator>
  );
}
