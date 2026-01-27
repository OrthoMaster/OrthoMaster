import React from 'react'
import {
  Image,
  Text,
  StyleSheet
} from 'react-native';

import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons, Entypo } from '@expo/vector-icons';

import { HomeStack } from './stacks/HomeStack';

import { TrainingStack } from './stacks/TrainingStack';
import { ProfileStack } from './stacks/ProfileStack';
import { CompanyStack } from './stacks/CompanyStack';

import { LessonStack } from './stacks/LessonStack';
import { FlashStack } from './stacks/FlashStack';
import { ToolsStack } from './stacks/ToolsStack';
import { ProfilStack } from './stacks/ProfilStack';

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

  // return (
  //   <Tab.Navigator
  //     id={"main-tabs" as unknown as undefined}
  //     initialRouteName='home'
  //     screenOptions={({ route }) => ({
  //       tabBarStyle: { backgroundColor: 'white', paddingBottom: insets.bottom },
  //       tabBarItemStyle: {
  //       },
  //       tabBarIcon: ({ focused, color, size }) => {
  //         let iconName;

  //         switch (route.name) {
  //           case 'training':
  //             iconName = focused
  //               ? require('../../assets/navigation/formation-icon.png')
  //               : require('../../assets/navigation/formation-icon-transparent.png')
  //             break;

  //           case 'Formation':
  //             iconName = focused
  //               ? require('../../assets/navigation/formation-icon.png')
  //               : require('../../assets/navigation/formation-icon-transparent.png')
  //             break;
  //           case 'Médias':
  //             iconName = focused
  //               ? require('../../assets/navigation/flash-icon.png')
  //               : require('../../assets/navigation/flash-icon-transparent.png')
  //             break;
  //           case 'Outils':
  //             iconName = focused
  //               ? require('../../assets/navigation/outils-icon.png')
  //               : require('../../assets/navigation/outils-icon-transparent.png')
  //             break;
  //           case 'Mon espace':
  //             iconName = focused
  //               ? require('../../assets/navigation/tableau-de-bord-icon.png')
  //               : require('../../assets/navigation/tableau-de-bord-icon-transparent.png')
  //             break;

  //           default:
  //             iconName = focused
  //               ? require('../../assets/navigation/accueil-icon.png')
  //               : require('../../assets/navigation/accueil-icon-transparent.png')
  //             break;
  //         }

  //         return <Image source={iconName}
  //           style={{
  //             width: '80%',
  //             height: '80%',
  //             resizeMode: 'contain',
  //           }}
  //         />;
  //       },
  //       tabBarActiveTintColor: Colors.black,
  //       tabBarInactiveTintColor: Colors.gray,
  //     })}
  //   >
  //     <Tab.Screen
  //       name="home"
  //       component={HomeStack}
  //       options={{
  //         headerShown: false,
  //         tabBarLabel: ({ focused }) => (
  //           <CustomTabBarLabel
  //             title="Acceuil"
  //             focused={focused}
  //             activeColor={Colors.primary}
  //           />
  //         )
  //       }}
  //     />
  //     <Tab.Screen
  //       name="training"
  //       component={TrainingStack}
  //       options={{
  //         headerShown: false,
  //         tabBarLabel: ({ focused }) => (
  //           <CustomTabBarLabel
  //             title="Formation"
  //             focused={focused}
  //             activeColor={Colors.blue}
  //           />
  //         )
  //       }}
  //     />
  //     <Tab.Screen
  //       name="Formation"
  //       component={LessonStack}
  //       options={{ headerShown: false }}
  //     />
  //     <Tab.Screen
  //       name="Médias"
  //       component={FlashStack}
  //       options={{ headerShown: false }}
  //     />
  //     <Tab.Screen
  //       name="Outils"
  //       component={ToolsStack}
  //       options={{ headerShown: false }}
  //     />
  //     <Tab.Screen name="Profil"
  //       component={ProfileStack}
  //       options={{ headerShown: false }}
  //     />
  //     <Tab.Screen name="Mon espace"
  //       component={ProfilStack}
  //       options={{ headerShown: false }}
  //     />
  //   </Tab.Navigator>
  // )

  return (
    <Tab.Navigator
      id={"main-tabs" as unknown as undefined}
      initialRouteName='home'
      screenOptions={({ route }) => ({
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