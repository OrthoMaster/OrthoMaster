import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';

// 1. IMPORT navigationRef từ file RootNavigation của bạn
import { navigationRef } from './RootNavigation';

import { HomeStack } from './stacks/HomeStack';
import { TrainingStack } from './stacks/TrainingStack';
import { ProfileStack } from './stacks/ProfileStack';
import { CompanyStack } from './stacks/CompanyStack';
import { FlashStack } from './stacks/FlashStack';
import { ToolsStack } from './stacks/ToolsStack';

import { useGetUser } from '../../src/hooks/auth.hook';
import Colors from '../../constants/Colors';
import Spacings from '../../constants/Spacings';

const Stack = createStackNavigator();
const SIDEBAR_WIDTH = 200;

const menuItems = [
  { name: 'home', title: 'Accueil', icon: require('../../assets/v2_images/icon/nav/home.png'), activeColor: Colors.primary, inactiveColor: Colors.orange2, component: HomeStack },
  { name: 'training', title: 'Formations', icon: require('../../assets/v2_images/icon/nav/training.png'), activeColor: Colors.lgreen, inactiveColor: Colors.lgreen2, component: TrainingStack },
  { name: 'media', title: 'Médias', icon: require('../../assets/v2_images/icon/nav/media.png'), activeColor: Colors.red, inactiveColor: Colors.red2, component: FlashStack },
  { name: 'tools', title: 'Outils', icon: require('../../assets/v2_images/icon/nav/tool.png'), activeColor: Colors.blue, inactiveColor: Colors.blue2, component: ToolsStack },
  { name: 'company', title: 'Équipe', icon: require('../../assets/v2_images/icon/nav/company.png'), activeColor: Colors.purple, inactiveColor: Colors.purple2, component: CompanyStack, requiresCompany: true },
  { name: 'profile', title: 'Profil', icon: require('../../assets/v2_images/icon/nav/profile.png'), activeColor: Colors.purple, inactiveColor: Colors.purple2, component: ProfileStack },
];

const Sidebar = () => {
  const { data: user } = useGetUser();
  const [activeRoute, setActiveRoute] = useState('home');

  const pulseAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (user?.remind_manager_to_add_package) {
      const pulse = Animated.loop(
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        })
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [user?.remind_manager_to_add_package]);

  useEffect(() => {
    const unsubscribe = navigationRef.current?.addListener('state', () => {
      const route = navigationRef.current?.getCurrentRoute();
      if (route) {
        const routeName = route.name;

        const matchedItem = menuItems.find(item => {
          if (routeName === item.name) return true;

          if (item.name === 'media' && routeName.startsWith('flash-media')) {
            return true;
          }
          if (item.name !== 'home' && routeName.startsWith(item.name)) {
            return true;
          }

          return false;
        });

        if (matchedItem) {
          setActiveRoute(matchedItem.name);
        } else if (routeName.includes('home') || routeName === 'flash-media-home') {
          setActiveRoute(routeName.startsWith('flash-media') ? 'media' : 'home');
        }
      }
    });
    return unsubscribe;
  }, []);

  const handleNavigate = (routeName: string) => {
    if (navigationRef.current?.isReady()) {
      (navigationRef.current as any).navigate(routeName);
    }
  };

  const visibleMenuItems = menuItems.filter(item => item.requiresCompany ? user?.has_company : true);

  return (
    <View style={styles.sidebar}>
      <View style={styles.logoContainer}>
        <Image source={require('../../assets/v2_images/logo/logo_primary_1024.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.logoText}>OrthoMaster</Text>
      </View>

      <ScrollView style={styles.menuScrollView} showsVerticalScrollIndicator={false}>
        {visibleMenuItems.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={[styles.menuItem, activeRoute === item.name && { backgroundColor: `${item.activeColor}40` }]}
            onPress={() => handleNavigate(item.name)}
          >
            <Image
              source={item.icon}
              style={styles.menuIcon}
              resizeMode='contain'
            />
            <Text style={[styles.menuText, { color: activeRoute === item.name ? item.activeColor : item.inactiveColor }]}>
              {item.title}
            </Text>
            {item.name === 'company' && user?.remind_manager_to_add_package && (
              <View style={styles.dotWrapper}>
                <Animated.View
                  style={[
                    styles.redDotRingInline,
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
                <View style={styles.redDotInline} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export const AppTab = () => {
  return (
    <View style={styles.container}>
      <Sidebar />
      <View style={styles.mainContent}>
        <Stack.Navigator id="main-stack" screenOptions={{ headerShown: false }}>
          {menuItems.map((item) => (
            <Stack.Screen key={item.name} name={item.name} component={item.component} />
          ))}
        </Stack.Navigator>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    height: '100vh' as any,
    backgroundColor: Colors.white
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: Colors.leftNavBackground,
    height: '100%'
  },
  logoContainer: {
    paddingVertical: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)'
  },
  logo: {
    width: 45,
    height: 45,
    marginBottom: 10,
    resizeMode: 'contain'
  },
  logoText: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: Colors.primary
  },
  menuScrollView: {
    flex: 1,
    paddingVertical: 15
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    borderRadius: 10,
    marginBottom: 8
  },
  menuIcon: {
    width: 22,
    height: 22,
    marginRight: 15
  },
  menuText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular'
  },
  mainContent: {
    flex: 1,
    overflow: 'hidden'
  },

  dotWrapper: {
    position: 'relative',
    width: 8,
    height: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  redDotInline: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
  },
  redDotRingInline: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
  },
});