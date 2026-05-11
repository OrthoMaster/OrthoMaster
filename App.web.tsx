import React, { useEffect, useState, useRef } from 'react';
import { Dimensions, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient } from '@tanstack/react-query';
import * as Linking from "expo-linking";
const prefix = Linking.createURL('/');

import { Animated } from 'react-native';

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
import DownloadPage from './src/views/download/DownloadPage';

const queryClient = new QueryClient();

export default function App({ navigation }) {
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);

  const [showSplash, setShowSplash] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [showOverlay, setShowOverlay] = useState(false);

  const { data: user } = useGetUser();
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const previousUserRef = useRef(null);

  // Listen to window resize
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setWindowWidth(window.width);
    });

    return () => subscription?.remove();
  }, []);

  // Check if should show mobile download page
  const shouldShowDownloadPage = Platform.OS === 'web' && windowWidth < 900;

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

  // Redirect to app if mobile device
  useEffect(() => {
    if (!appIsReady) return;

    const isTouchDevice = /iPhone|iPad|Android/i.test(navigator.userAgent) ||
      (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
    const isNotDesktop = isTouchDevice && windowWidth < 1024;

    if (!isNotDesktop) return;

    const params = new URLSearchParams(window.location.search);
    const contentId = params.get('id');
    const isMediaPreview = window.location.pathname.includes('open/media-preview');

    const isEspacePro = window.location.pathname.includes('open/company');

    if (!isMediaPreview || !contentId || !isEspacePro) return;

    // Try to open app
    if (isEspacePro) {
      window.location.href = `orthomaster://open/company`;
      return;
    }

    window.location.href = `orthomaster://open/content/${contentId}`;
  }, [appIsReady]);

  // Link to screen
  const routeNameRef = React.useRef<string | undefined>(null);
  const linking = {
    prefixes: [prefix],
    config: {
      screens: {
        home: {
          screens: {
            'home': 'home',
            'invoice-view': 'open/invoice/:invoiceId',
          }
        },
        training: 'training',
        media: {
          screens: {
            'flash-media-home': 'open/media-preview/:id?',
          }
        },
        tools: 'tools',
        company: {
          screens: {
            'company-view': 'open/company',
          }
        },
        profile: 'profile',
      }
    }
  };

  // Show download page for mobile screens
  if (shouldShowDownloadPage && appIsReady && !showSplash) {
    return <DownloadPage />;
  }

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