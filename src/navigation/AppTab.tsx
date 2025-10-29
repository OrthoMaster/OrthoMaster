import React from 'react'
import {
  Image,
  Text
} from 'react-native'

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { HomeStack } from './stacks/HomeStack';

import { TrainingStack } from './stacks/TrainingStack';

import { LessonStack } from './stacks/LessonStack';
import { FlashStack } from './stacks/FlashStack';
import { ToolsStack } from './stacks/ToolsStack';
import { ProfilStack } from './stacks/ProfilStack';

import Colors from '../../constants/Colors';

const Tab = createBottomTabNavigator();
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const AppTab = ({ }) => {
  const insets = useSafeAreaInsets();

  const CustomTabBarLabel = ({
    title,
    focused,
    activeColor,
  }: {
    title: string;
    focused: boolean;
    activeColor: string;
  }) => (
    <Text style={{
      color: focused ? activeColor : Colors.gray,
      fontSize: 10,
      fontFamily: focused ? 'Poppins-Medium' : 'Poppins-Regular',
      textTransform: 'none'
    }}>
      {title}
    </Text>
  );

  return (
    <Tab.Navigator
      id={"main-tabs" as unknown as undefined}
      initialRouteName='home'
      screenOptions={({ route }) => ({
        tabBarStyle: { backgroundColor: 'white', paddingBottom: insets.bottom },
        tabBarItemStyle: {
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'training':
              iconName = focused
                ? require('../../assets/navigation/formation-icon.png')
                : require('../../assets/navigation/formation-icon-transparent.png')
              break;

            case 'Formation':
              iconName = focused
                ? require('../../assets/navigation/formation-icon.png')
                : require('../../assets/navigation/formation-icon-transparent.png')
              break;
            case 'Médias':
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
        tabBarActiveTintColor: Colors.black,
        tabBarInactiveTintColor: Colors.gray,
      })}
    >
      <Tab.Screen
        name="home"
        component={HomeStack}
        options={{
          headerShown: false,
          tabBarLabel: ({ focused }) => (
            <CustomTabBarLabel
              title="Acceuil"
              focused={focused}
              activeColor={Colors.primary}
            />
          )
        }}
      />
      <Tab.Screen
        name="training"
        component={TrainingStack}
        options={{
          headerShown: false,
          tabBarLabel: ({ focused }) => (
            <CustomTabBarLabel
              title="Formation"
              focused={focused}
              activeColor={Colors.blue}
            />
          )
        }}
      />
      <Tab.Screen
        name="Formation"
        component={LessonStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Médias"
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