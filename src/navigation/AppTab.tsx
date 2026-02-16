import React from 'react'
import {
  Image,
  Text,
  StyleSheet
} from 'react-native';

import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { HomeStack } from './stacks/HomeStack';

import { TrainingStack } from './stacks/TrainingStack';
import { ProfileStack } from './stacks/ProfileStack';
import { CompanyStack } from './stacks/CompanyStack';

import { FlashStack } from './stacks/FlashStack';
import { ToolsStack } from './stacks/ToolsStack';

import { useGetUser } from '../../src/hooks/auth.hook';
import Colors from '../../constants/Colors';


const Tab = createBottomTabNavigator();
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const AppTab = ({ }) => {
  const insets = useSafeAreaInsets();
  const { data: user } = useGetUser();

  const CustomTabBarLabel = ({
    title,
    focused,
    activeColor,
    disabledColor,
  }: {
    title: string;
    focused: boolean;
    activeColor: string;
    disabledColor: string;
  }) => (
    <Text style={{
      color: focused ? activeColor : disabledColor,
      fontSize: focused ? 9 : 7,
      fontFamily: focused ? 'Poppins-Medium' : 'Poppins-Regular',
      textTransform: 'none',
      marginTop: focused ? -2 : -4,
    }}>
      {title}
    </Text>
  );

  return (
    <Tab.Navigator
      id={"main-tabs" as unknown as undefined}
      initialRouteName='home'
      screenOptions={() => ({
        tabBarLabelPosition: 'below-icon',
        tabBarStyle: { backgroundColor: 'white', paddingBottom: insets.bottom },
      })}
    >
      <Tab.Screen
        name="home"
        component={HomeStack}
        options={{
          headerShown: false,
          tabBarLabel: ({ focused }) => (
            <CustomTabBarLabel
              title="Accueil"
              focused={focused}
              activeColor={Colors.primary}
              disabledColor={Colors.orange2}
            />
          ),
          tabBarIcon: ({ focused }) => (
            <Image
              style={focused ? styles.activeIcon : [styles.inactiveIcon, {width: 15}]}
              resizeMode="contain"
              source={require('../../assets/v2_images/icon/nav/home.png')}
            />
          )
        }}
      />

      <Tab.Screen name="training"
        component={TrainingStack}
        options={{
          headerShown: false,
          tabBarLabel: ({ focused }) => (
            <CustomTabBarLabel
              title="Formations"
              focused={focused}
              activeColor={Colors.lgreen}
              disabledColor={Colors.lgreen2}
            />
          ),
          tabBarIcon: ({ focused }) => (
            <Image
              style={focused ? [styles.activeIcon, {width: 40}] : [styles.inactiveIcon, {width: 20}]}
              resizeMode="contain"
              source={require('../../assets/v2_images/icon/nav/training.png')}
            />
          )
        }}
      />

      <Tab.Screen name="media"
        component={FlashStack}
        options={{
          headerShown: false,
          tabBarLabel: ({ focused }) => (
            <CustomTabBarLabel
              title="Médias"
              focused={focused}
              activeColor={Colors.red}
              disabledColor={Colors.red2}
            />
          ),
          tabBarIcon: ({ focused }) => (
            <Image
              style={focused ? [styles.activeIcon, {width: 30}] : styles.inactiveIcon}
              resizeMode="contain"
              source={require('../../assets/v2_images/icon/nav/media.png')}
            />
          )
        }}
      />

      <Tab.Screen name="tools"
        component={ToolsStack}
        options={{
          headerShown: false,
          tabBarLabel: ({ focused }) => (
            <CustomTabBarLabel
              title="Outils"
              focused={focused}
              activeColor={Colors.blue}
              disabledColor={Colors.blue2}
            />
          ),
          tabBarIcon: ({ focused }) => (
            <Image
              style={focused ? styles.activeIcon : styles.inactiveIcon}
              resizeMode="contain"
              source={require('../../assets/v2_images/icon/nav/tool.png')}
            />
          )
        }}
      />

      {user && user?.has_company &&
        <Tab.Screen name="company"
          component={CompanyStack}
          options={{
            headerShown: false,
            tabBarLabel: ({ focused }) => (
              <CustomTabBarLabel
                title="Équipe"
                focused={focused}
                activeColor={Colors.purple}
                disabledColor={Colors.purple2}
              />
            ),
            tabBarIcon: ({ focused }) => (
              <Image
              style={focused ? styles.activeIcon : styles.inactiveIcon}
              resizeMode="contain"
              source={require('../../assets/v2_images/icon/nav/company.png')}
            />
            )
          }}
        />
      }

      <Tab.Screen name="profile"
        component={ProfileStack}
        options={{
          headerShown: false,
          tabBarLabel: ({ focused }) => (
            <CustomTabBarLabel
              title="Profil"
              focused={focused}
              activeColor={Colors.purple}
              disabledColor={Colors.purple2}
            />
          ),
          tabBarIcon: ({ focused }) => (
            <Image
              style={focused ? [styles.activeIcon, {width: 20}] : styles.inactiveIcon}
              resizeMode="contain"
              source={require('../../assets/v2_images/icon/nav/profile.png')}
            />
          )
        }}
      />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  activeIcon: {
    width: 25,
    height: 40,
    marginBottom: 2,
  },
  inactiveIcon: {
    width: 15,
    height: 30,
    opacity: 0.4,
  }
});