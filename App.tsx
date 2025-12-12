
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Linking from "expo-linking"
const prefix = Linking.createURL('/');

import { AppTab } from './src/navigation/AppTab';
import { AuthStack } from './src/navigation/stacks/AuthStack';
import { LoadingContent } from './src/component/LoadingContent';
import { navigationRef } from './src/navigation/RootNavigation';

import { GlobalProvider } from './src/component/GlobalContext';
import { Provider } from 'react-native-paper';
import { UseCaptureGuard } from './src/component/captureGuard/useCaptureGuard';
import * as Font from 'expo-font';
import CustomSplashScreen from './src/views/splash/CustomSplashScreen';
import { useGetUser } from './src/hooks/auth.hook';
import { useGlobalNotification } from './src/hooks/useGlobalNotification';

import Colors from './constants/Colors';
import Spacings from './constants/Spacings';
import Toast, { BaseToast } from 'react-native-toast-message';

export default function App({ navigation }) {
  const queryClient = useQueryClient();
  // const newQueryClient = new QueryClient();

  const [showSplash, setShowSplash] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);

  const { data: user } = useGetUser();

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
          {
            user ?
              <UseCaptureGuard>
                <QueryClientProvider client={queryClient}>
                  <AppTab />
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