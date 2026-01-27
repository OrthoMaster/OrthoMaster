import React, {useEffect, useState} from 'react'

import { createStackNavigator } from '@react-navigation/stack';

import { FlashMediaView } from '../../views/flash/FlashMediaView';
import { ContentDisplayer } from "../../views/content/ContentDisplayer";
import { PreviewMediaView } from '../../views/flash/PreviewMediaView';
import ChannelMediaView from '../../views/flash/ChannelMediaView';
import ReturnButtonIcon from '../components/ReturnButton';
import { useIsFocused } from '@react-navigation/native';
import { getCurrentDate } from '../../futils';
import { saveEvent } from '../../services/SessionEventService';


const FlashStackNav = createStackNavigator();
export const FlashStack = ({}) => {

  // const focused = useIsFocused()
  // const startDate = null

  // useEffect(() => {
  //   if (focused) {
  //     startDate = getCurrentDate()
  //   } else {
  //     const event : SessionEventScreen = 
  //     saveEvent("screen_view", {

  //     })
  //   }
  // }, [focused])
  


  return (
    <FlashStackNav.Navigator
    initialRouteName='flash-media-home'
    screenOptions={{
      animation: 'default'
    }}
    >
      <FlashStackNav.Screen
        name="flash-media-home"
        component={FlashMediaView}
        options={{
          headerShown: true,
          title: 'Médias',
          headerTintColor: '#fff',
          headerStyle: {
            backgroundColor: "#FF4B4B",
            height: 120,
          },
          headerTitleStyle: {
            fontSize: 20,
            fontFamily: 'Poppins-Medium',
            marginLeft: 8,
            marginBottom: 8,
          },
          headerTitleAlign: 'left'
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
          headerShown: false,
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