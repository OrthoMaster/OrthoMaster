
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';

import { selectIsLoggedIn, selectIsLoading, selectUserCurrentSession } from './src/reducers/auth';
import { checkUserConnection } from './src/actions/auth';

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

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}

async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log(token);
  } else {
    alert('Must use physical device for Push Notifications');
  }

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


