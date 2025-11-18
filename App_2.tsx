
import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, useNavigation, useNavigationContainerRef } from '@react-navigation/native';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Linking from "expo-linking"
const prefix = Linking.createURL('/');

import { AppTab } from './src/navigation/AppTab';
import { AuthStack } from './src/navigation/stacks/AuthStack';
import { getUserAttachedOffices } from './src/services/OfficeService';
import { LoadingContent } from './src/component/LoadingContent';
import { InitialConfigForm } from './src/views/initialConfigForm/InitialConfigForm';
import { useGetUser } from './src/hooks/useGetUser.hook';
import { getCurrentDate } from './src/futils';
import { closeSession, getSessionId, saveEvent, startSession } from './src/services/SessionEventService';
import { SessionEventScreen } from './src/utils/myTypes';
import { useSessionEventFlusher } from './src/hooks/useSessionEventFlusher';
import { navigationRef } from './src/navigation/RootNavigation';

import { GlobalProvider } from './src/component/GlobalContext';
import { Provider } from 'react-native-paper';
import { UseCaptureGuard } from './src/component/captureGuard/useCaptureGuard';
import * as Font from 'expo-font';
import CustomSplashScreen from './src/views/splash/CustomSplashScreen';
import * as AuthService from './src/services/v2/AuthService';
import { User } from './src/services/v2/AuthService';

export default function App({ navigation }) {
  // author: Francis
  const navigationRef = useNavigationContainerRef();
  const queryClient = useQueryClient();

  const [appIsReady, setAppIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [animationDone, setAnimationDone] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Handle login success
  const handleLoginSuccess = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    async function prepare() {
      try {
        // 1. Load fonts
        console.log('📱 Loading fonts...');
        await Font.loadAsync({
          Roboto: require('./assets/fonts/Roboto-VariableFont_wdth,wght.ttf'),
          'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
          'Poppins-Light': require('./assets/fonts/Poppins-Light.ttf'),
          'Poppins-Medium': require('./assets/fonts/Poppins-Medium.ttf'),
          'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
        });
        console.log('✅ Fonts loaded');

        // 2. Kiểm tra token
        const token = await AuthService.getToken();
        console.log('🔑 Token exists:', token);

        if (token) {
          // 3. Verify token với API /me
          console.log('🔍 Verifying token...');
          const userData = await AuthService.me();

          if (userData) {
            console.log('✅ Token valid, user:', userData.email);
            setIsAuthenticated(true);
            setUser(userData);
          } else {
            console.log('❌ Token invalid');
            setIsAuthenticated(false);
            // setUser(null);
          }
        } else {
          console.log('❌ No token found');
        }

        // 4. Simulate loading
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error('❌ Error during initialization:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  if (!appIsReady || showSplash) {
    return <CustomSplashScreen onFinish={() => setShowSplash(false)} />;
  }
  // End

  return (
    <NavigationContainer ref={navigationRef}>
      <GlobalProvider handleLoginSuccess={handleLoginSuccess}>
        <Provider>
          {!isAuthenticated ? (
            <AuthStack />
          ) : (
            <UseCaptureGuard>
              <AppTab />
            </UseCaptureGuard>
          )}
        </Provider>
      </GlobalProvider>
    </NavigationContainer>
  );
}