import React from 'react'

import { createStackNavigator } from '@react-navigation/stack';

import { FlashMediaView } from '../../views/flash/FlashMediaView';

import { ContentDisplayer } from "../../views/content/ContentDisplayer";
import { PreviewMediaView } from '../../views/flash/PreviewMediaView';
import ChannelMediaView from '../../views/flash/ChannelMediaView';
import ReturnButtonIcon from '../components/ReturnButton';

const FlashStackNav = createStackNavigator();
export const FlashStack = ({navigation}) => {



  return (
    <FlashStackNav.Navigator initialRouteName='flash-media-home'>
      <FlashStackNav.Screen
        name="flash-media-home"
        component={FlashMediaView}
        options={{
          headerShown: true,
          title: 'Médias',
          headerTintColor: '#fff',
          headerStyle: {
            backgroundColor: "#8089D1"
          },
          headerTitleStyle: {
            fontSize: 20,
            fontWeight: 'bold'
          }
        }}
      />

      <FlashStackNav.Screen
        name="flash-media-channel"
        component={ChannelMediaView}
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackButtonDisplayMode: "minimal",
          headerTransparent: true,
          headerBackImage: ()=>(<ReturnButtonIcon />)
        }}
      />

      <FlashStackNav.Screen
        name="flash-media-preview"
        component={PreviewMediaView}
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackButtonDisplayMode: "minimal",
          headerTintColor: '#000',
          headerTransparent: true,
          headerBackImage: ()=>(<ReturnButtonIcon />)
        }}
      />

      <FlashStackNav.Screen
        name="flash-media-viewer"
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
    </FlashStackNav.Navigator>
  );
}