import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Linking from "expo-linking";
const prefix = Linking.createURL('/');

import { View, Animated } from 'react-native';

import { AppTab } from './src/navigation/AppTab';
import { AuthStack } from './src/navigation/stacks/AuthStack';
import { navigationRef } from './src/navigation/RootNavigation';

import { GlobalProvider } from './src/component/GlobalContext';
import { Provider } from 'react-native-paper';
import { UseCaptureGuard } from './src/component/captureGuard/useCaptureGuard';
import * as Font from 'expo-font';
import CustomSplashScreen from './src/views/splash/CustomSplashScreen';
import { useGetUser } from './src/hooks/auth.hook';
import { authEvents, sendError } from './src/services/v2/AuthService';

import SessionExpiredScreen from './src/views/auth/components/SessionExpiredScreen';

// Constants for app reset logic (WEB)
const LAST_ACTIVE_KEY = '@app_last_active_time';
const LAST_DATE_KEY = '@app_last_date';
const INACTIVE_DURATION = 2 * 60 * 60 * 1000; // 2 hours

const queryClient = new QueryClient();

export default function App({ navigation }) {
  const [showSplash, setShowSplash] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [showOverlay, setShowOverlay] = useState(false);

  const { data: user } = useGetUser();
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const previousUserRef = useRef(null);

  // WEB: Check if app should reset based on inactivity or new day
  const checkIfShouldResetApp = async () => {
    try {
      const lastActive = localStorage.getItem(LAST_ACTIVE_KEY);
      const lastDate = localStorage.getItem(LAST_DATE_KEY);
      const now = Date.now();
      const today = new Date().toDateString();

      let shouldReset = false;

      if (lastDate && lastDate !== today) {
        shouldReset = true;
      }

      if (lastActive && !shouldReset) {
        const timeDiff = now - parseInt(lastActive);
        if (timeDiff > INACTIVE_DURATION) {
          shouldReset = true;
        }
      }

      if (shouldReset) {
        await resetAppData();
      } else {
        localStorage.setItem(LAST_ACTIVE_KEY, now.toString());
        localStorage.setItem(LAST_DATE_KEY, today);
      }
    } catch (error) {
      sendError('reset-app', error);
    }
  };

  // Reset app data
  const resetInProgress = useRef(false);
  const resetAppData = async () => {
    if (resetInProgress.current) return;
    resetInProgress.current = true;

    try {
      setShowSplash(true);

      await queryClient.invalidateQueries({ queryKey: ['current-user'] });
      await queryClient.invalidateQueries({ queryKey: ['daily-action'] });

      const now = Date.now();
      const today = new Date().toDateString();
      localStorage.setItem(LAST_ACTIVE_KEY, now.toString());
      localStorage.setItem(LAST_DATE_KEY, today);

      if (navigationRef.current?.isReady()) {
        const homeUrl = Linking.createURL('open/home');
        await Linking.openURL(homeUrl);
      }

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
        await Font.loadAsync({
          Roboto: require('./assets/fonts/Roboto-VariableFont_wdth,wght.ttf'),
          'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
          'Poppins-Light': require('./assets/fonts/Poppins-Light.ttf'),
          'Poppins-Medium': require('./assets/fonts/Poppins-Medium.ttf'),
          'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
        });

        // WEB: Use localStorage
        const savedUser = localStorage.getItem('user');
        if (!savedUser) {
          queryClient.clear();
        } else {
          queryClient.setQueryData(['current-user'], JSON.parse(savedUser));
        }

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

  // Save user id
  useEffect(() => {
    if (user && previousUserRef.current !== user?.id) {
      setShowSessionExpired(false);
    }
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
    queryClient.clear();
  };

  // WEB: Track page visibility instead of AppState
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        // Page hidden - save timestamp
        const now = Date.now();
        localStorage.setItem(LAST_ACTIVE_KEY, now.toString());
      } else {
        // Page visible - check if should reset
        await checkIfShouldResetApp();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // Link to screen
  const routeNameRef = React.useRef<string | undefined>(null);
  const linking = {
    prefixes: [prefix],
    config: {
      screens: {
        home: 'open/home',
        training: 'open/training',
        media: 'open/media',
        tools: 'open/tools',
        company: 'open/company',
        profile: 'open/profile',
      }
    }
  };

  return (
    <>
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

      {appIsReady && !showSplash && (
        <NavigationContainer
          linking={linking}
          ref={navigationRef}
          onReady={() => {
            routeNameRef.current = navigationRef.current.getCurrentRoute().name;
          }}
          onStateChange={async () => {
            const currentRouteName = navigationRef.current.getCurrentRoute().name;
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