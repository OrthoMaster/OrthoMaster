import React, { useRef, useEffect, useState } from 'react'
import {
  Image,
  AppState,
  Text
} from 'react-native'
import { useMutation } from 'react-query';
import { saveLogtimeOnApp } from '../services/LogsService';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { HomeStack } from './stacks/HomeStack';
import { LessonStack } from './stacks/LessonStack';
import { FlashStack } from './stacks/FlashStack';
import { ToolsStack } from './stacks/ToolsStack';
import { ProfilStack } from './stacks/ProfilStack';

import { getCurrentDate } from "../utils";

const Tab = createBottomTabNavigator();


export const AppTab = ({ }) => {
  const appState = useRef(AppState.currentState);
  const mutation = useMutation(saveLogtimeOnApp);

  var launchDate = getCurrentDate()

  useEffect(() => {
    const userLogtimeHandling = AppState.addEventListener("change", nextAppState => {
      if (appState.current.match(/inactive|background/) &&
        nextAppState === "active") {
        launchDate = getCurrentDate()
      } else if (appState.current == "active" && (nextAppState === "background" || nextAppState == "inactive")) {
        saveAppLogs({
          login: launchDate,
          logout: getCurrentDate()
        })
      }
      appState.current = nextAppState;
    });


    return () => {
      userLogtimeHandling.remove();
    };
  }, []);


  const saveAppLogs = async (log) => {
    try {
      await mutation.mutateAsync(log)
    } catch (error) {
      throw error
    } finally {
      console.log('[ LOG App ]:', log)
    }
  }


  return (
    <Tab.Navigator
      initialRouteName='Accueil'
      screenOptions={({ route }) => ({
        tabBarStyle: { backgroundColor: 'white', height: 80 },
        tabBarItemStyle: {
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Accueil':
              iconName = focused
                ? require('../../assets/navigation/accueil-icon.png')
                : require('../../assets/navigation/accueil-icon-transparent.png')
              break;
            case 'Formation':
              iconName = focused
                ? require('../../assets/navigation/formation-icon.png')
                : require('../../assets/navigation/formation-icon-transparent.png')
              break;
            case 'Flash ortho':
              iconName = focused
                ? require('../../assets/navigation/flash-icon.png')
                : require('../../assets/navigation/flash-icon-transparent.png')
              break;
            case 'Outils':
              iconName = focused
                ? require('../../assets/navigation/outils-icon.png')
                : require('../../assets/navigation/outils-icon-transparent.png')
              break;
            case 'Mon espace':
              iconName = focused
                ? require('../../assets/navigation/tableau-de-bord-icon.png')
                : require('../../assets/navigation/tableau-de-bord-icon-transparent.png')
              break;


            default:
              iconName = focused
                ? require('../../assets/navigation/accueil-icon.png')
                : require('../../assets/navigation/accueil-icon-transparent.png')
              break;
          }

          return <Image source={iconName}
            style={{
              width: '80%',
              height: '80%',
              resizeMode: 'contain',
            }}
          />;
        },
        tabBarActiveTintColor: 'black',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen
        name="Accueil"
        component={HomeStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Formation"
        component={LessonStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Flash ortho"
        component={FlashStack}
        options={{ headerShown: false }}

      />
      <Tab.Screen
        name="Outils"
        component={ToolsStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Mon espace"
        component={ProfilStack}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  )

} 