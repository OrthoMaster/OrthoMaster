
import React, { useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { useQueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Linking from "expo-linking"
const prefix = Linking.createURL('/');

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';

import { AppTab } from './src/navigation/AppTab';
import { AuthStack } from './src/navigation/stacks/AuthStack';
import { navigationRef } from './src/navigation/RootNavigation';

import { GlobalProvider } from './src/component/GlobalContext';
import { Provider } from 'react-native-paper';
import { UseCaptureGuard } from './src/component/captureGuard/useCaptureGuard';
import * as Font from 'expo-font';
import CustomSplashScreen from './src/views/splash/CustomSplashScreen';
import { useGetUser } from './src/hooks/auth.hook';
import { authEvents, updateSettings } from './src/services/v2/AuthService';

import SessionExpiredScreen from './src/views/auth/components/SessionExpiredScreen';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'OrthoMaster',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#Eb7b07',
  });
}

export default function App({ navigation }) {
  const queryClient = useQueryClient();

  const [showSplash, setShowSplash] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);

  const { data: user } = useGetUser();
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const previousUserRef = useRef(null);

  // Font
  useEffect(() => {
    async function prepare() {
      try {
        // Load fonts
        await Font.loadAsync({
          Roboto: require('./assets/fonts/Roboto-VariableFont_wdth,wght.ttf'),
          'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
          'Poppins-Light': require('./assets/fonts/Poppins-Light.ttf'),
          'Poppins-Medium': require('./assets/fonts/Poppins-Medium.ttf'),
          'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
        });

        const savedUser = await AsyncStorage.getItem('user');
        if (!savedUser) {
          queryClient.clear();
        } else {
          queryClient.setQueryData(['current-user'], JSON.parse(savedUser));
        }
      } catch (error) {
        // TODO: Send api emergency
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  // Save user id to know this is the first time login
  useEffect(() => {
    // First time
    if (user && previousUserRef.current !== user?.id) {
      setShowSessionExpired(false);
    }

    // Save current user id
    previousUserRef.current = user?.id || null;
  }, [user]);

  // Force login
  useEffect(() => {
    const handleUnauthorized = () => {
      if (user) {
        setShowSessionExpired(true);
      }
    };

    authEvents.on('unauthorized', handleUnauthorized);
    return () => {
      authEvents.off('unauthorized', handleUnauthorized);
    };
  }, [queryClient, user]);

  const handleLoginPress = () => {
    setShowSessionExpired(false);
    // Clear React Query cache
    queryClient.clear();
  };

  const appState = useRef(AppState.currentState);
  const notificationListener = useRef<Notifications.EventSubscription | undefined>(undefined);
  const responseListener = useRef<Notifications.EventSubscription | undefined>(undefined);

  // Register device when user login and app ready
  useEffect(() => {
    if (user && appIsReady) {
      handleRegisterDevice();
    }
  }, [user, appIsReady]);

  // Listen app state changes - re-register when app active
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (user) {
          handleRegisterDevice();
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [user]);

  // Register device for notification
  const handleRegisterDevice = async () => {
    try {
      // Check permission status
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Ask permission if not reject (undetermined)
      if (existingStatus === 'undetermined') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // If no permission -> return
      if (finalStatus !== 'granted') {
        return;
      }

      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });
      const deviceId = Device.osBuildId || Device.osInternalBuildId || `device-${Date.now()}`;

      // Register with backend
      await updateSettings({ notifications: true });
    } catch (error) {
      // TODO: Send api error
    }
  };

  // Listener notification
  useEffect(() => {
    // Listen notification (app openning)
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => { });

    // Listen action tab into notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      // Get notification
      const data = response.notification.request.content.data;

      // Handle navigation
      handleNotificationNavigation(data);
    });

    // Cleanup when unmount
    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user]);

  // Handle navigation when lick to notification
  const handleNotificationNavigation = (data: any) => {
    if (!user) return;

    const action = data.action || 'notification';
    let path = 'open/profile-view/notification-list';
    switch (action) {
      case 'training':
        path = 'open/training-list';
        break;
      case 'document':
        path = 'open/documents';
        break;
      case 'company':
        path = 'open/company';
        break;
      default:
        path = 'open/profile-view/notification-list';
        break;
    }
    
    const url = Linking.createURL(path);
    Linking.openURL(url);
  };


  // Link to screen
  const routeNameRef = React.useRef<string | undefined>(null);
  const linking = {
    prefixes: [prefix],
    config: {
      screens: {
        'Accueil': {
          screens: {
            "home-home": {
              path: "open/content/:id"
            }
          }
        },
        'Médias': {
          screens: {
            'flash-media-home': {
              path: "open/media-preview/:id"
            }
          }
        },
        'training': {
          screens: {
            "training-list": {
              path: "open/training-list"
            }
          }
        },
        'company': {
          screens: {
            "company-view": {
              path: "open/company"
            }
          }
        },
        'profile': {
          screens: {
            "profile-view": {
              path: "open/profile-view/:screen"
            },
            "notification-list": {
              path: "open/notifications"
            },
            "document-view": {
              path: "open/documents"
            }
          },
        }
      }
    }
  };

  // Splash - customize
  if (!appIsReady || showSplash) {
    return <CustomSplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // if (isLoading) {
  //   return <LoadingContent />
  // }

  return (
    <NavigationContainer linking={linking}
      ref={navigationRef}
      onReady={() => {
        routeNameRef.current = navigationRef.current.getCurrentRoute().name;
      }}
      onStateChange={async () => {
        const currentRouteName = navigationRef.current.getCurrentRoute().name;
        // Save the current route name for later comparison
        routeNameRef.current = currentRouteName;
      }}
    >
      <GlobalProvider>
        <Provider>
          {user ?
            <UseCaptureGuard>
              <QueryClientProvider client={queryClient}>
                <AppTab />
                <SessionExpiredScreen
                  visible={showSessionExpired}
                  onLoginPress={handleLoginPress}
                />
              </QueryClientProvider>
            </UseCaptureGuard>
            :
            <AuthStack />
          }
        </Provider>
      </GlobalProvider>
    </NavigationContainer>
  );
}