import React, { useRef, useEffect, useState } from 'react'
import {
  Image,
  AppState,
  Platform
} from 'react-native'
import { useMutation, useQuery } from 'react-query';
import { saveLogtimeOnApp } from '../services/LogsService';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { HomeStack } from './stacks/HomeStack';
import { LessonStack } from './stacks/LessonStack';
import { FlashStack } from './stacks/FlashStack';
import { ToolsStack } from './stacks/ToolsStack';
import { ProfilStack } from './stacks/ProfilStack';


import { getCurrentDate } from "../utils";


// import * as Linking from "expo-linking"
import { useNavigation } from '@react-navigation/native';
import { useGetUser } from '../hooks/useGetUser.hook';
import { getContentById } from '../services/ContentService';
import { getUserRegisteredFormation } from '../services/FormationService';



const Tab = createBottomTabNavigator();


export const AppTab = ({ }) => {
  const appState = useRef(AppState.currentState);
  const mutation = useMutation(saveLogtimeOnApp);
  const user = useGetUser()

  var launchDate = getCurrentDate()

  const nav = useNavigation()
  //const accessUrl = Linking.useURL();


  const handleOpenContent = async (id) => {
    getContentById(id)
    .then((content) => {
      if (content.type == "lesson") {
        getUserRegisteredFormation({
          idUserFormation: 0
        }).then((formations) => {
          if (formations && Array.isArray(formations)) {
            const currentFormation = formations.filter((f)=>f.id_formation === content.id_formation)
            nav.navigate('Accueil', {
              screen: "home-content",
              params:
              {
                "content": content,
                "formation": currentFormation[0],
                "type": "lesson",
                "demoMode": !currentFormation[0].certifying && !currentFormation[0].is_paid && !user.data.is_student
              }
            })
          }
        })
      } else {
        nav.navigate('Accueil', {
          screen: "home-content",
          params:
          {
            "content": content,
            "type": "flash",
          }
        })
      }
    })
  }


  // useEffect(() => {
  //   if (accessUrl) {
  //     const { hostname, path, queryParams } = Linking.parse(accessUrl);

  //     if (path === "open/content") {
  //       //handleOpenContent(queryParams.id)
  //     }

  //   }

  // }, [accessUrl])

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
    }
  }


  return (
    <Tab.Navigator
      initialRouteName='Accueil'
      screenOptions={({ route }) => ({
        tabBarStyle: { backgroundColor: 'white', height: Platform.OS === 'ios' ? 80 : 60 },
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
            case 'Ressources':
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
        name="Ressources"
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