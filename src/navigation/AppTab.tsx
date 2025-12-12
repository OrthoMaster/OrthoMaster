import React from 'react'
import {
  Image,
  Text
} from 'react-native'

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

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
              disabledColor={Colors.primaryDisabled}
            />
          ),
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons name={'home'}
              size={focused ? 26 : 20}
              color={focused ? Colors.primary : Colors.primaryDisabled} />
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
              activeColor={Colors.blue}
              disabledColor={Colors.blueDisabled}
            />
          ),
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons name={'book-open-page-variant-outline'}
              size={focused ? 24 : 18}
              color={focused ? Colors.blue : Colors.blueDisabled} />
          )
        }}
      />

      <Tab.Screen name="media"
        component={FlashStack}
        options={{
          headerShown: false,
          tabBarLabel: ({ focused }) => (
            <CustomTabBarLabel
              title="Média"
              focused={focused}
              activeColor={Colors.primaryLight}
              disabledColor={Colors.primaryLightDisabled}
            />
          ),
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons name={'motion-play-outline'}
              size={focused ? 24 : 18}
              color={focused ? Colors.primaryLight : Colors.primaryLightDisabled} />
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
              activeColor={Colors.green}
              disabledColor={Colors.greenDisabled}
            />
          ),
          tabBarIcon: ({ focused }) => (
            <Ionicons name={'construct'}
              size={focused ? 24 : 18}
              color={focused ? Colors.green : Colors.greenDisabled} />
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
                activeColor={Colors.blue}
                disabledColor={Colors.blueDisabled}
              />
            ),
            tabBarIcon: ({ focused }) => (
              <MaterialCommunityIcons name={'account-group-outline'}
                size={focused ? 26 : 18}
                color={focused ? Colors.blue : Colors.blueDisabled} />
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
              activeColor={Colors.primary}
              disabledColor={Colors.primaryDisabled}
            />
          ),
          tabBarIcon: ({ focused }) => (
            <Ionicons name={'person-circle-outline'}
              size={focused ? 26 : 18}
              color={focused ? Colors.primary : Colors.primaryDisabled} />
          )
        }}
      />

    </Tab.Navigator>
  )

} 