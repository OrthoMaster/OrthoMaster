import React, { useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
const prefix = Linking.createURL('/');

import * as Updates from 'expo-updates';
import * as Notifications from 'expo-notifications';
import { AppState, Platform, View, Animated, StyleSheet } from 'react-native';

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
const INACTIVE_DURATION = 2 * 60 * 60 * 1000; // 2 hours

const queryClient = new QueryClient();

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);

  // Animation overlay
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [showOverlay, setShowOverlay] = useState(false);

  const { data: user } = useGetUser();
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const previousUserRef = useRef(null);

  // FIX #5: deep link đang chờ xử lý → không cho reset đè lên
  const pendingDeepLink = useRef(false);

  // FIX #3: điều hướng bị hoãn khi navigation chưa ready
  const pendingNavigation = useRef<any>(null);

  const appState = useRef(AppState.currentState);
  const notificationListener = useRef<Notifications.EventSubscription | undefined>(undefined);
  const responseListener = useRef<Notifications.EventSubscription | undefined>(undefined);
  const routeNameRef = useRef<string | undefined>(null);

  // ---------- OTA ----------
  const checkForOTAUpdate = async () => {
    if (__DEV__) return;
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    }
  };

  // ---------- Reset logic ----------
  const checkIfShouldResetApp = async () => {
    try {
      const lastActive = await AsyncStorage.getItem(LAST_ACTIVE_KEY);
      const lastDate = await AsyncStorage.getItem(LAST_DATE_KEY);
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
        await AsyncStorage.setItem(LAST_ACTIVE_KEY, now.toString());
        await AsyncStorage.setItem(LAST_DATE_KEY, today);
      }
    } catch (error) {
      sendError('reset-app', error);
    }
  };

  const resetInProgress = useRef(false);
  const resetAppData = async () => {
    if (resetInProgress.current) return;

    // FIX #5: deep link ưu tiên hơn reset — không điều hướng về home đè lên link
    if (pendingDeepLink.current) {
      const now = Date.now();
      await AsyncStorage.setItem(LAST_ACTIVE_KEY, now.toString());
      await AsyncStorage.setItem(LAST_DATE_KEY, new Date().toDateString());
      return;
    }

    resetInProgress.current = true;

    try {
      setShowSplash(true);

      await queryClient.invalidateQueries({ queryKey: ['current-user'] });
      await queryClient.invalidateQueries({ queryKey: ['daily-action'] });

      const now = Date.now();
      const today = new Date().toDateString();
      await AsyncStorage.setItem(LAST_ACTIVE_KEY, now.toString());
      await AsyncStorage.setItem(LAST_DATE_KEY, today);

      // FIX #3: navigate trực tiếp thay vì Linking.openURL
      if (navigationRef.current?.isReady()) {
        navigationRef.current.navigate('home', { screen: 'home' });
      }

      await new Promise((resolve) => setTimeout(resolve, 800));
    } catch (error) {
      sendError('reset-app', error);
    } finally {
      resetInProgress.current = false;
      setShowSplash(false);
    }
  };

  // ---------- FIX #5: theo dõi deep link ----------
  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) {
        pendingDeepLink.current = true;
        setTimeout(() => {
          pendingDeepLink.current = false;
        }, 5000);
      }
    });

    const sub = Linking.addEventListener('url', () => {
      pendingDeepLink.current = true;
      setTimeout(() => {
        pendingDeepLink.current = false;
      }, 3000);
    });

    return () => sub.remove();
  }, []);

  // ---------- Font loading & init ----------
  useEffect(() => {
    async function prepare() {
      try {
        await checkForOTAUpdate().catch(() => { });

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

        await checkIfShouldResetApp();
      } catch (error) {
        sendError('prepare-app', error);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();

    // FIX #1: listener phải remove trong cleanup, không gọi ngay
    Notifications.setBadgeCountAsync(0);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        Notifications.setBadgeCountAsync(0);
      }
    });

    return () => sub.remove();
  }, []);

  // ---------- Safety timeout for splash ----------
  useEffect(() => {
    if (appIsReady) {
      const timeout = setTimeout(() => {
        if (showSplash) setShowSplash(false);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [appIsReady]);

  // ---------- Track user ----------
  useEffect(() => {
    if (user && previousUserRef.current !== user?.id) {
      setShowSessionExpired(false);
    }
    previousUserRef.current = user?.id || null;
  }, [user]);

  // ---------- Force login on unauthorized ----------
  useEffect(() => {
    const handleUnauthorized = () => {
      if (user) setShowSessionExpired(true);
    };

    authEvents.on('unauthorized', handleUnauthorized);
    return () => {
      authEvents.off('unauthorized', handleUnauthorized);
    };
  }, [user]);

  const handleLoginPress = () => {
    setShowSessionExpired(false);
    queryClient.clear();
  };

  // ---------- Register device ----------
  const handleRegisterDevice = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus === 'undetermined') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') return;
      if (!user) return;

      if (user.settings.notifications === null) {
        await updateNotiPermission({ notifications: true });
      }
    } catch (error) {
      sendError('register-device', error);
    }
  };

  useEffect(() => {
    if (user && appIsReady) {
      handleRegisterDevice();
    }
  }, [user, appIsReady]);

  // ---------- AppState changes ----------
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
        const now = Date.now();
        await AsyncStorage.setItem(LAST_ACTIVE_KEY, now.toString());
      }

      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // FIX #6: bọc catch để không chặn các bước phía sau khi mất mạng
        await checkForOTAUpdate().catch(() => { });
        await checkIfShouldResetApp();

        if (user) handleRegisterDevice();
      }

      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [user]);

  // ---------- FIX #3 + #4: notification navigation ----------
  const handleNotificationNavigation = (data: any) => {
    const action = data?.action || 'notification';

    if (action === 'media') {
      const id = data?.id ?? data?.id_content ?? data?.media_id;
      const target: [string, any] = ['media', { screen: 'flash-media-home', params: { id: id ? String(id) : undefined } }];

      if (navigationRef.current?.isReady()) {
        navigationRef.current.navigate(target[0] as never, target[1] as never);
      } else {
        pendingNavigation.current = target;
      }
      return;
    }

    const routes: Record<string, [string, any]> = {
      'training': ['training', { screen: 'training-list' }],
      'document': ['profile', { screen: 'document-view' }],
      'company': ['company', { screen: 'company-view' }],
      'daily-question': ['home', { screen: 'home', params: { action: 'daily-question' } }],
      'podcast': ['home', { screen: 'home', params: { action: 'podcast' } }],
    };

    const target = routes[action] || ['profile', { screen: 'notification-list' }];
    const [tab, params] = target;

    if (navigationRef.current?.isReady()) {
      navigationRef.current.navigate(tab as never, params as never);
    } else {
      // hoãn lại, flush trong onReady
      pendingNavigation.current = target;
    }
  };

  useEffect(() => {
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = response.notification.request.content.data;
        pendingDeepLink.current = true; // chặn reset đè lên
        handleNotificationNavigation(data);
        setTimeout(() => {
          pendingDeepLink.current = false;
        }, 5000);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(() => { });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      handleNotificationNavigation(data);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // ---------- Linking config ----------
  const linking = {
    prefixes: [prefix],
    config: {
      screens: {
        'home': {
          path: 'open/home',
          screens: {
            'home': { path: 'open/daily-content/:action' },
            'invoice-view': { path: 'open/invoice/:invoiceId' },
          },
        },
        'media': {
          screens: {
            // FIX: :id? optional để match cả ?id=632 lẫn /632
            'flash-media-home': { path: 'open/media-preview/:id?' },
          },
        },
        'training': {
          screens: {
            'training-list': { path: 'open/training-list' },
          },
        },
        'company': {
          screens: {
            'company-view': { path: 'open/company' },
          },
        },
        'profile': {
          screens: {
            'profile-view': { path: 'open/profile-view/:screen' },
            'notification-list': { path: 'open/notifications' },
            'document-view': { path: 'open/documents' },
          },
        },
        'tools': {
          screens: {
            'products-view': 'tools/products-view',
          },
        },
      },
    },
  };

  return (
    <>
      {/* FIX #2: NavigationContainer luôn mount ngay khi ready → nhận initial URL */}
      {appIsReady && (
        <NavigationContainer
          linking={linking}
          ref={navigationRef}
          onReady={() => {
            routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;

            // flush điều hướng bị hoãn
            if (pendingNavigation.current) {
              const [tab, params] = pendingNavigation.current;
              pendingNavigation.current = null;
              navigationRef.current?.navigate(tab as never, params as never);
            }
          }}
          onStateChange={() => {
            routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
          }}
        >
          <GlobalProvider>
            <Provider>
              {user ? (
                <UseCaptureGuard>
                  <AppTab />
                  <SessionExpiredScreen
                    visible={showSessionExpired}
                    onLoginPress={handleLoginPress}
                  />
                </UseCaptureGuard>
              ) : (
                <AuthStack />
              )}
            </Provider>
          </GlobalProvider>
        </NavigationContainer>
      )}

      {/* Splash overlay — phủ LÊN navigation, không thay thế */}
      {(!appIsReady || showSplash) && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999 }]}>
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
                  }).start(() => setShowOverlay(false));
                }, 100);
              });
            }}
          />
        </View>
      )}

      {/* Animated overlay */}
      {showOverlay && (
        <Animated.View
          style={{
            ...StyleSheet.absoluteFillObject,
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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}