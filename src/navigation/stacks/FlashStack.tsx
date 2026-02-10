import React, { useEffect, useState } from 'react'

import { Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';

import { FlashMediaView } from '../../views/flash/FlashMediaView';
import { ContentDisplayer } from "../../views/content/ContentDisplayer";
import { PreviewMediaView } from '../../views/flash/PreviewMediaView';
import ChannelMediaView from '../../views/flash/ChannelMediaView';
import ReturnButtonIcon from '../components/ReturnButton';


const FlashStackNav = createStackNavigator();
export const FlashStack = ({ }) => {
  return (
    <FlashStackNav.Navigator
      id={"media-stack" as undefined}
      initialRouteName='flash-media-home'
      screenOptions={{
        animation: 'default',
        title: 'Médias' // for web
      }}
    >
      <FlashStackNav.Screen
        name="flash-media-home"
        component={FlashMediaView}
        options={
          Platform.OS === 'web'
            ? { headerShown: false, }
            : {
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

      {Platform.OS === 'web'
        ? <FlashStackNav.Screen
          name="flash-media-channel"
          component={ChannelMediaView}
          options={{
            headerShown: false,
            animation: 'fade_from_bottom',
          }}
        />
        : <FlashStackNav.Screen
          name="flash-media-channel"
          component={ChannelMediaView}
          options={{
            headerShown: true,
            headerTitle: "",
            headerBackButtonDisplayMode: "minimal",
            headerTransparent: true,
            headerBackImage: () => (<ReturnButtonIcon />)
          }}
        />
      }

      {Platform.OS === 'web'
        ? <FlashStackNav.Screen
          name="flash-media-preview"
          component={PreviewMediaView}
          options={{
            headerShown: false,
            presentation: 'transparentModal',
            animation: 'slide_from_right',
          }}
        />
        : <FlashStackNav.Screen
          name="flash-media-preview"
          component={PreviewMediaView}
          options={{
            headerShown: false,
          }}
        />
      }
      {Platform.OS === 'web'
        ? <FlashStackNav.Screen
          name="flash-media-viewer"
          component={ContentDisplayer}
          options={{
            headerShown: false,
          }}
        />
        : <FlashStackNav.Screen
          name="flash-media-viewer"
          component={ContentDisplayer}
          options={{
            headerShown: true,
            headerTitle: "",
            headerBackButtonDisplayMode: "minimal",
            headerTintColor: '#000',
            headerTransparent: true,
            headerBackImage: () => (<ReturnButtonIcon />)
          }}
        />
      }

    </FlashStackNav.Navigator>
  );
}