import React from 'react'


import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { FlashView } from '../../views/flash/FlashView';
import { FlashLayout } from '../../views/flash/FlashLayout';

import { ContentDisplayer } from "../../views/content/ContentDisplayer";


const FlashStackNav = createNativeStackNavigator();
export const FlashStack = () => {
  return (
    <FlashStackNav.Navigator initialRouteName='flash-home'>
      <FlashStackNav.Screen
        name="flash-home"
        component={FlashView}
        options={{
          headerShown: false
          //title: 'Flash orthopédie'
        }}
      />

      <FlashStackNav.Screen
        name="flash-selection"
        component={FlashLayout}
        options={{
          headerBackTitleVisible: false,
          //title: 'Flash'
        }}
      />

      <FlashStackNav.Screen
        name="flash-content"
        component={ContentDisplayer}
        options={{
          headerShown: false
        }}
      />
    </FlashStackNav.Navigator>
  );
}