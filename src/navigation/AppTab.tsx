import React, { useEffect, useRef } from 'react'
import {
  Image,
  Text,
  StyleSheet,
  View,
  Animated
} from 'react-native';

import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { StackActions } from '@react-navigation/native';
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

const AnimatedRedDot = () => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      })
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <View style={styles.dotWrapper}>
      <Animated.View
        style={[
          styles.redDotRing,
          {
            opacity: pulseAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.6, 0],
            }),
            transform: [{
              scale: pulseAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 2.5],
              })
            }]
          }
        ]}
      />
      <View style={styles.redDot} />
    </View>
  );
};

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
      fontSize: focused ? (title == 'Formations' ? 9.5 : 11) : 9,
      fontFamily: focused ? 'Poppins-Medium' : 'Poppins-Regular',
      textTransform: 'none',
      marginTop: focused ? 2 : 1,
    }}>
      {title}
    </Text>
  );

  return (
    <Tab.Navigator
      id={"main-tabs"}
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
              style={focused ? styles.activeIcon : [styles.inactiveIcon, { width: 20 }]}
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
              style={focused ? [styles.activeIcon, { width: 40 }] : [styles.inactiveIcon, { width: 30 }]}
              resizeMode="contain"
              source={require('../../assets/v2_images/icon/nav/training.png')}
            />
          )
        }}
      />

      <Tab.Screen name="media"
        component={FlashStack}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();

            navigation.navigate('media', {
              screen: 'flash-media-home',
            });

            // La pile est vidée : l'onglet repart de zéro
            navigation.getState().routes
              .find((r) => r.name === 'media')
              ?.state?.key && navigation.dispatch({
                ...StackActions.popToTop(),
                target: navigation.getState().routes.find((r) => r.name === 'media')?.state?.key,
              });
          },
        })}
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
              style={focused ? [styles.activeIcon, { width: 35 }] : styles.inactiveIcon}
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
              style={focused ? styles.activeIcon : [styles.inactiveIcon, { width: 20 }]}
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
              <View style={styles.iconContainer}>
                <Image
                  style={focused ? styles.activeIcon : styles.inactiveIcon}
                  resizeMode="contain"
                  source={require('../../assets/v2_images/icon/nav/company.png')}
                />
                {user?.remind_manager_to_add_package && (
                  <AnimatedRedDot />
                )}
              </View>
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
              style={focused ? [styles.activeIcon, { width: 25 }] : [styles.inactiveIcon, { width: 20 }]}
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
    width: 30,
    height: 40,
    marginBottom: 0,
  },
  inactiveIcon: {
    width: 25,
    height: 30,
    opacity: 0.5,
  },

  iconContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotWrapper: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 10,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.danger,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  redDotRing: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.danger,
  },
});