import React from 'react'


import { createStackNavigator } from '@react-navigation/stack';

import { FlashMediaView } from '../../views/flash/FlashMediaView';

import { ContentDisplayer } from "../../views/content/ContentDisplayer";
import { PreviewMediaView } from '../../views/flash/PreviewMediaView';


const FlashStackNav = createStackNavigator();
export const FlashStack = () => {
  return (
    <FlashStackNav.Navigator initialRouteName='flash-media-home'>
      <FlashStackNav.Screen
        name="flash-media-home"
        component={FlashMediaView}
        options={{
          headerShown: false,
          //title: 'Flash orthopédie'
        }}
      />

      <FlashStackNav.Screen
        name="flash-media-preview"
        component={PreviewMediaView}
        options={{
          headerShown: false,
          title: 'Media',
        }}
      />

      <FlashStackNav.Screen
        name="flash-media-viewer"
        component={ContentDisplayer}
        options={{
          headerShown: false
        }}
      />
    </FlashStackNav.Navigator>
  );
}