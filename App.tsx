
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { useQueryClient } from "@tanstack/react-query";
import * as Linking from "expo-linking"
const prefix = Linking.createURL('/');

import { AppTab } from './src/navigation/AppTab';
import { AuthStack } from './src/navigation/stacks/AuthStack';
import { LoadingContent } from './src/component/LoadingContent';
import { navigationRef } from './src/navigation/RootNavigation';

import { GlobalProvider } from './src/component/GlobalContext';
import { UseCaptureGuard } from './src/component/captureGuard/useCaptureGuard';
import * as Font from 'expo-font';
import CustomSplashScreen from './src/views/splash/CustomSplashScreen';
import { useGetUser } from './src/hooks/auth.hook';

export default function App({ navigation }) {
  const queryClient = useQueryClient();

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

        // Check saved user
        const savedUser = await AsyncStorage.getItem('user');
        if (savedUser) {
          queryClient.setQueryData(['current-user'], JSON.parse(savedUser));
        } else {
          queryClient.setQueryData(['current-user'], false);
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
        {
          user ?
            <UseCaptureGuard>
              <AppTab />
            </UseCaptureGuard>
            :
            <AuthStack />
        }
      </GlobalProvider>
    </NavigationContainer>
  );
}