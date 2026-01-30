import React, { useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Linking from "expo-linking"
const prefix = Linking.createURL('/');

import * as Notifications from 'expo-notifications';
import { AppState, Platform, View, Animated } from 'react-native';

import { AppTab } from './src/navigation/AppTab';
import { AuthStack } from './src/navigation/stacks/AuthStack';
import { navigationRef } from './src/navigation/RootNavigation';

import { GlobalProvider } from './src/component/GlobalContext';
import { Provider } from 'react-native-paper';
import { UseCaptureGuard } from './src/component/captureGuard/useCaptureGuard';
import * as Font from 'expo-font';
import CustomSplashScreen from './src/views/splash/CustomSplashScreen';
import { useGetUser } from './src/hooks/auth.hook';
import { authEvents, updateNotiPermission, sendError } from './src/services/v2/AuthService';

import SessionExpiredScreen from './src/views/auth/components/SessionExpiredScreen';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
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

// Constants for app reset logic
const LAST_ACTIVE_KEY = '@app_last_active_time';
const LAST_DATE_KEY = '@app_last_date';
const INACTIVE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

const queryClient = new QueryClient();

export default function App({ navigation }) {
  const [showSplash, setShowSplash] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);
  // Animation overlay
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [showOverlay, setShowOverlay] = useState(false);

  const { data: user } = useGetUser();
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const previousUserRef = useRef(null);

  // Check if app should reset based on inactivity or new day
  const checkIfShouldResetApp = async () => {
    try {
      const lastActive = await AsyncStorage.getItem(LAST_ACTIVE_KEY);
      const lastDate = await AsyncStorage.getItem(LAST_DATE_KEY);
      const now = Date.now();
      const today = new Date().toDateString();

      let shouldReset = false;

      // Check 1: Different day
      if (lastDate && lastDate !== today) {
        shouldReset = true;
      }

      // Check 2: Inactive for more than 2 hours
      if (lastActive && !shouldReset) {
        const timeDiff = now - parseInt(lastActive);
        if (timeDiff > INACTIVE_DURATION) {
          shouldReset = true;
        }
      }

      if (shouldReset) {
        await resetAppData();
      } else {
        // Update last active time and date
        await AsyncStorage.setItem(LAST_ACTIVE_KEY, now.toString());
        await AsyncStorage.setItem(LAST_DATE_KEY, today);
      }

    } catch (error) {
      sendError('reset-app', error);
    }
  };

  // Reset app data and navigation
  const resetInProgress = useRef(false);
  const resetAppData = async () => {
    if (resetInProgress.current) return;
    resetInProgress.current = true;

    try {
      // Show splash
      setShowSplash(true);

      // Reload data
      await queryClient.invalidateQueries({ queryKey: ['current-user'] });
      await queryClient.invalidateQueries({ queryKey: ['daily-action'] });

      // Update timestamps
      const now = Date.now();
      const today = new Date().toDateString();
      await AsyncStorage.setItem(LAST_ACTIVE_KEY, now.toString());
      await AsyncStorage.setItem(LAST_DATE_KEY, today);

      // Navigate to home using deep link
      // Navigation phải đợi NavigationContainer ready
      if (navigationRef.current?.isReady()) {
        const homeUrl = Linking.createURL('open/home');
        await Linking.openURL(homeUrl);
      }

      // Wait for data to load
      await new Promise(resolve => setTimeout(resolve, 800));
      setShowSplash(false);
    } catch (error) {
      sendError('reset-app', error);
    } finally {
      resetInProgress.current = false;
      setShowSplash(false);
    }
  };

  // Font loading and initialization
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

        // Check if app should reset on startup
        await checkIfShouldResetApp();
      } catch (error) {
        sendError('prepare-app', error);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  // Safety timeout for splash
  useEffect(() => {
    if (appIsReady) {
      const timeout = setTimeout(() => {
        if (showSplash) setShowSplash(false);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [appIsReady]);

  // Save user id to know this is the first time login
  useEffect(() => {
    // First time
    if (user && previousUserRef.current !== user?.id) {
      setShowSessionExpired(false);
    }

    // Save current user id
    previousUserRef.current = user?.id || null;
  }, [user]);

  // Force login on unauthorized
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

  // Listen app state changes - handle reset and re-register
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      // When app goes to background
      if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
        // Save timestamp when app goes inactive
        const now = Date.now();
        await AsyncStorage.setItem(LAST_ACTIVE_KEY, now.toString());
      }

      // When app comes to foreground
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // Check if should reset app
        await checkIfShouldResetApp();

        // Re-register device for notifications if user exists
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

      if (!user) {
        return;
      }

      if (user.settings.notifications === null) {
        await updateNotiPermission({ notifications: true });
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'appareil:', error);
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

  // Handle navigation when click to notification
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
      case 'daily-question':
        path = 'open/daily-content/daily-question';
        break;
      case 'podcast':
        path = 'open/daily-content/podcast';
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
        'home': {
          path: 'open/home',
          screens: {
            "home-home": {
              path: "open/daily-content/:action",
            }
          },
        },
        'media': {
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

  return (
    <>
      {/* CustomSplash - z-index: 9999 */}
      {(!appIsReady || showSplash) && (
        <CustomSplashScreen
          appIsReady={appIsReady}
          onFinish={() => {
            setShowOverlay(true);

            Animated.timing(overlayOpacity, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }).start(() => {
              setShowSplash(false);

              setTimeout(() => {
                Animated.timing(overlayOpacity, {
                  toValue: 0,
                  duration: 400,
                  useNativeDriver: true,
                }).start();
              }, 100);
            });
          }}
        />
      )}

      {/* NavigationContainer - z-index: 0 */}
      {appIsReady && !showSplash && (
        <NavigationContainer
          linking={linking}
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
                  <AppTab />
                  <SessionExpiredScreen
                    visible={showSessionExpired}
                    onLoginPress={handleLoginPress}
                  />
                </UseCaptureGuard>
                :
                <AuthStack />
              }
            </Provider>
          </GlobalProvider>
        </NavigationContainer>
      )}

      {/* Animated overlay */}
      {showOverlay && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#000',
            opacity: overlayOpacity,
            zIndex: 10000,
          }}
          pointerEvents="none"
        />
      )}
    </>
  );

}