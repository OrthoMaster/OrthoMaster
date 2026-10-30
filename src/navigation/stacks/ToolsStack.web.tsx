import React from 'react'

import { createStackNavigator } from '@react-navigation/stack';
import { Platform } from 'react-native';
import { ToolsView } from '../../views/tools/ToolsView';
import { QueChoisirView } from '../../views/tools/components/QueChoisir/View/QueChoisirView';
import { FinalQC } from "../../views/tools/components/QueChoisir/FinalView/FinalQC";
import { ContentDisplayer } from '../../views/content/ContentDisplayer';
import ReturnButtonIcon from '../components/ReturnButton';

import { ChatbotView } from '../../views/chatbot/ChatbotView';

const ToolsStackNav = createStackNavigator();

export const ToolsStack = ({ navigation, route }) => {

  return (
    <ToolsStackNav.Navigator
      id={"tools-stack" as undefined}
      initialRouteName='tools-home'
      screenOptions={{ title: 'Outils' }}
    >
      <ToolsStackNav.Screen
        name="tools-home"
        component={ToolsView}
        options={{ headerShown: false }}
      />
      <ToolsStackNav.Screen
        name="tools-content"
        component={ContentDisplayer}
        options={
          Platform.OS == 'web'
            ? {
              headerShown: false,
            }
            : {
              headerShown: true,
              headerTitle: "",
              headerBackButtonDisplayMode: "minimal",
              headerTintColor: '#000',
              headerTransparent: true,
              headerBackImage: () => (<ReturnButtonIcon />)
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
          headerBackImage: () => (<ReturnButtonIcon />)
        }}

      />

      <ToolsStackNav.Screen
        name={'tools-que-choisir-final'}
        component={FinalQC}
        options={{ headerShown: false, title: 'Que choisir ?' }}
      />

      <ToolsStackNav.Screen
        name={'chatbot-view'}
        component={ChatbotView}
        options={{ headerShown: false, title: 'Assistance IA' }}
      />
    </ToolsStackNav.Navigator>
  );
}
