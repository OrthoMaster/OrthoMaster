import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { StackActions } from '@react-navigation/native';

// 1. IMPORT navigationRef từ file RootNavigation của bạn
import { navigationRef } from './RootNavigation';

import { HomeStack } from './stacks/HomeStack';
import { TrainingStack } from './stacks/TrainingStack';
import { ProfileStack } from './stacks/ProfileStack';
import { CompanyStack } from './stacks/CompanyStack';
import { FlashStack } from './stacks/FlashStack';
import { ToolsStack } from './stacks/ToolsStack';
import { BookingSpace } from './stacks/BookingSpace.web';

import { useQuery } from '@tanstack/react-query';
import { useGetUser } from '../../src/hooks/auth.hook';
import { getExpertRequests, getMyBookingSetup } from '../services/v2/BookingService';
import { EXPERT_REQUESTS_KEY } from '../views/booking/requests/RequestsView';
import Colors from '../../constants/Colors';
import Spacings from '../../constants/Spacings';

const Stack = createStackNavigator();
const SIDEBAR_WIDTH = 200;

const menuItems = [
  { name: 'home', title: 'Accueil', icon: require('../../assets/v2_images/icon/nav/home.png'), activeColor: Colors.primary, inactiveColor: Colors.orange2, component: HomeStack },
  { name: 'training', title: 'Formations', icon: require('../../assets/v2_images/icon/nav/training.png'), activeColor: Colors.lgreen, inactiveColor: Colors.lgreen2, component: TrainingStack },
  // Rendez-vous experts : sur le web, une entrée de la barre latérale (sur mobile, une carte dans Formations).
  { name: 'rendez-vous', title: 'Rendez-vous', icon: require('../../assets/v2_images/icon/nav/rendezvous.png'), activeColor: Colors.lblue, inactiveColor: Colors.lblue2, component: BookingSpace },
  { name: 'media', title: 'Médias', icon: require('../../assets/v2_images/icon/nav/media.png'), activeColor: Colors.red, inactiveColor: Colors.red2, component: FlashStack },
  { name: 'tools', title: 'Outils', icon: require('../../assets/v2_images/icon/nav/tool.png'), activeColor: Colors.blue, inactiveColor: Colors.blue2, component: ToolsStack },
  { name: 'company', title: 'Équipe', icon: require('../../assets/v2_images/icon/nav/company.png'), activeColor: Colors.purple, inactiveColor: Colors.purple2, component: CompanyStack, requiresCompany: true },
  { name: 'profile', title: 'Profil', icon: require('../../assets/v2_images/icon/nav/profile.png'), activeColor: Colors.purple, inactiveColor: Colors.purple2, component: ProfileStack },
];

/** Écran de premier niveau actif (barre latérale), en descendant la pile d'états. */
const isInside = (state: any, name: string): boolean => {
  if (!state?.routes) return false;
  const route = state.routes[state.index ?? 0];
  return route?.name === name || isInside(route?.state, name);
};

const Sidebar = () => {
  const { data: user } = useGetUser();
  const [activeRoute, setActiveRoute] = useState('home');

  /* ---- Rendez-vous : pastille des demandes en attente (expert) ---- */
  const { data: bookingSetup } = useQuery({
    queryKey: ['booking', 'me'],
    queryFn: () => getMyBookingSetup(),
    staleTime: 60 * 1000,
  });
  // Même requête que l'onglet Demandes : le chiffre suit la liste sans appel en plus.
  const { data: expertRequests } = useQuery({
    queryKey: EXPERT_REQUESTS_KEY,
    queryFn: async () => {
      const result = await getExpertRequests();
      if (!result) throw new Error('requests');
      return result;
    },
    enabled: bookingSetup?.is_expert === true,
    refetchInterval: 2 * 60 * 1000,
  });
  const pendingRequests = expertRequests?.pending.length ?? 0;

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
      // Écrans internes de l'espace rendez-vous (experts-list, agenda-home…) : pas de préfixe commun.
      if (isInside(navigationRef.current?.getRootState(), 'rendez-vous')) {
        setActiveRoute('rendez-vous');
        return;
      }

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
    if (!navigationRef.current?.isReady()) return;

    const nav = navigationRef.current as any;

    if (routeName === 'media') {
      const route = nav.getRootState().routes.find((r: any) => r.name === 'media');

      nav.navigate('media');

      // Pile vidée : la rubrique repart de son accueil
      if (route?.state?.key) {
        nav.dispatch({
          ...StackActions.popToTop(),
          target: route.state.key,
        });
      }

      return;
    }

    nav.navigate(routeName);
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
            {item.name === 'rendez-vous' && pendingRequests > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{pendingRequests > 9 ? '9+' : pendingRequests}</Text>
              </View>
            )}
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

  countBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    marginLeft: 8,
    borderRadius: 10,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: Colors.white,
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