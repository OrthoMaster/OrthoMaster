import React from 'react'

import { createStackNavigator } from '@react-navigation/stack';
import { AppTab } from './AppTab';
import { ContentStack } from './stacks/ContentStack';


const RootStack = createStackNavigator()
export const AppRootStack = () => {
  return (
    <RootStack.Navigator
      initialRouteName='main'
    >
      <RootStack.Screen
        name="main"
        component={AppTab}
        options={{
          headerShown: false
        }}
      />

      <RootStack.Screen
        name="content"
        component={ContentStack}
        options={{
          headerShown: false,
        }}
      />
      
    </RootStack.Navigator>
  );
}