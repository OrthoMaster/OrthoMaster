import React from 'react'
import AntDesign from '@expo/vector-icons/AntDesign';

import { createStackNavigator } from '@react-navigation/stack';

import { FlashMediaView } from '../../views/flash/FlashMediaView';

import { ContentDisplayer } from "../../views/content/ContentDisplayer";
import { PreviewMediaView } from '../../views/flash/PreviewMediaView';
import ChannelMediaView from '../../views/flash/ChannelMediaView';
import { Text, TouchableOpacity, View } from 'react-native';


const FlashStackNav = createStackNavigator();
export const FlashStack = ({navigation}) => {

  const ReturnImageButton = () => {
    return <AntDesign name="left" size={24} color="black" style={{
      backgroundColor: '#fff',
      padding: 5,
      borderRadius: 5,
      marginLeft: 10, marginTop: 10,
      shadowOffset: {width: 0, height: 0},
      shadowRadius: 3,
      shadowOpacity: 0.5
    }}/>
  }

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
          },
        }}
      />

      <FlashStackNav.Screen
        name="flash-media-channel"
        component={ChannelMediaView}
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackButtonDisplayMode: "minimal",
          headerTintColor: '#000',
          headerTransparent: true,
          headerBackImage: ()=>(<ReturnImageButton />)
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
          headerBackImage: ()=>(<ReturnImageButton />)
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