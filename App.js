
// import React, { useEffect, useState } from 'react';

import { selectIsLoggedIn, selectIsLoading, selectUserCurrentSession } from './src/reducers/auth';
import { checkUserConnection } from './src/actions/auth';
// import { NavigationContainer } from '@react-navigation/native';

import { useSelector, useDispatch } from 'react-redux';
import { restoreLocalConfigAsync } from './src/utils';
import checkVersion from 'react-native-store-version';
import Constants from 'expo-constants';
import {
  QueryClientProvider,
} from 'react-query'
import { OmQueryClient } from './src/component/OmQueryClient';
import { Alert } from 'react-native';

import { AppTab } from './src/navigation/AppTab';
import { AuthStack } from './src/navigation/stacks/AuthStack';
import { LoadingContent } from './src/component/LoadingContent';
import { AlertVersion } from './src/component/AlertVersion';
import { ErrorHandler } from './src/component/ErrorHandler';
import { NotificationHandler } from './src/component/NotificationHandler';

export default function App({ navigation }) {

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  console.log('->',token);
  return token;
}

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);




  return (
    <ErrorHandler>
      <QueryClientProvider client={OmQueryClient}>
        <NavigationContainer>
          {
            isLoggedIn && user.enabled == 1 ? (
              <NotificationHandler>
                <AppTab />
              </NotificationHandler>
            ) : isLoading
              ? (
                <LoadingContent />
              ) : (
                <AuthStack />
              )}
          <AlertVersion isVisible={modalVersionIsVisible} onClose={() => setmodalVersionIsVisible(false)} />
        </NavigationContainer>
      </QueryClientProvider>
    </ErrorHandler>
  );
}


