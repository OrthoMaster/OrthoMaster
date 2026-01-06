
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { useQueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Linking from "expo-linking"
const prefix = Linking.createURL('/');

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AppState } from 'react-native';

import { AppTab } from './src/navigation/AppTab';
import { AuthStack } from './src/navigation/stacks/AuthStack';
import { navigationRef } from './src/navigation/RootNavigation';

import { GlobalProvider } from './src/component/GlobalContext';
import { Provider } from 'react-native-paper';
import { UseCaptureGuard } from './src/component/captureGuard/useCaptureGuard';
import * as Font from 'expo-font';
import CustomSplashScreen from './src/views/splash/CustomSplashScreen';
import { useGetUser } from './src/hooks/auth.hook';
import { useGlobalNotification } from './src/hooks/useGlobalNotification';
import { authEvents, registerDevice } from './src/services/v2/AuthService';

import SessionExpiredScreen from './src/views/auth/components/SessionExpiredScreen';

import Colors from './constants/Colors';
import Spacings from './constants/Spacings';
import Toast, { BaseToast } from 'react-native-toast-message';

export default function App({ navigation }) {
  const queryClient = useQueryClient();

  const [showSplash, setShowSplash] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);

  const { data: user } = useGetUser();
  const [showSessionExpired, setShowSessionExpired] = useState(false);

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

  // Force login
  useEffect(() => {
    const handleUnauthorized = () => {
      setShowSessionExpired(true);
    };

    authEvents.on('unauthorized', handleUnauthorized);
    return () => {
      authEvents.off('unauthorized', handleUnauthorized);
    };
  }, [queryClient]);

  const handleLoginPress = () => {
    setShowSessionExpired(false);
    // Clear React Query cache
    queryClient.clear();
  };


  const appState = React.useRef(AppState.currentState);
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
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID, // eas project id
      });

      const deviceId = Device.osBuildId || Device.osInternalBuildId || `device-${Date.now()}`;

      // Register with backend
      await registerDevice({
        fcm_token: tokenData.data,
        device_id: deviceId,
        device_type: Device.osName === 'iOS' ? 'ios' : 'android',
      });
    } catch (error) {
      // TODO: Send api error
      console.error('Register device failed:', error);
    }
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
        }
      }
    }
  };

  // Toast - notification
  const toastConfig = {
    info: (props: any) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: Colors.info,
          backgroundColor: Colors.infoBackground,
          width: 'auto',
          marginRight: Spacings.md,
          marginLeft: Spacings.md,
        }}
        text1Style={{
          fontSize: 14,
          fontFamily: 'Poppins-Medium',
          color: Colors.info
        }}
        text2Style={{
          fontSize: 11,
          fontFamily: 'Poppins-Light',
          color: Colors.text
        }}
        text2NumberOfLines={3}
      />
    ),
    success: (props: any) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: Colors.success,
          backgroundColor: Colors.successBackground,
          width: 'auto',
          marginRight: Spacings.md,
          marginLeft: Spacings.md,
        }}
        text1Style={{
          fontSize: 14,
          fontFamily: 'Poppins-Medium',
          color: Colors.success
        }}
        text2Style={{
          fontSize: 11,
          fontFamily: 'Poppins-Light',
          color: Colors.text
        }}
        text2NumberOfLines={3}
      />
    ),
    warning: (props: any) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: Colors.warning,
          backgroundColor: Colors.warningBackground,
          width: 'auto',
          marginRight: Spacings.md,
          marginLeft: Spacings.md,
        }}
        text1Style={{
          fontSize: 14,
          fontFamily: 'Poppins-Medium',
          color: Colors.warning
        }}
        text2Style={{
          fontSize: 11,
          fontFamily: 'Poppins-Light',
          color: Colors.text
        }}
        text2NumberOfLines={3}
      />
    ),
    danger: (props: any) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: Colors.danger,
          backgroundColor: Colors.dangerBackground,
          width: 'auto',
          marginRight: Spacings.md,
          marginLeft: Spacings.md,
        }}
        text1Style={{
          fontSize: 14,
          fontFamily: 'Poppins-Medium',
          color: Colors.danger
        }}
        text2Style={{
          fontSize: 11,
          fontFamily: 'Poppins-Light',
          color: Colors.text
        }}
        text2NumberOfLines={3}
      />
    ),
  };

  // Splash - customize
  if (!appIsReady || showSplash) {
    return <CustomSplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // if (isLoading) {
  //   return <LoadingContent />
  // }

  const NotificationWatcher = () => {
    useGlobalNotification(); // hook polling
    return null;
  };

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
                <NotificationWatcher />
                <Toast config={toastConfig} />
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