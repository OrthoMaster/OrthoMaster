
// import React, { useEffect, useState } from 'react';

// import { NavigationContainer } from '@react-navigation/native';

// import { useSelector, useDispatch } from 'react-redux'
// import { checkUserConnection } from './src/actions/auth';

// import { selectIsLoggedIn, selectIsLoading, selectUserCurrentSession } from './src/reducers/auth';

// import { restoreLocalConfigAsync } from './src/utils';
// import checkVersion from 'react-native-store-version';
// import Constants from 'expo-constants';
// import {
//   QueryClientProvider,
// } from 'react-query'
// import { OmQueryClient } from './src/component/OmQueryClient';

// import { Alert } from 'react-native';

// import { AppTab } from './src/navigation/AppTab';
// import { AuthStack } from './src/navigation/stacks/AuthStack';
// import { LoadingContent } from './src/component/LoadingContent';
// import { AlertVersion } from './src/component/AlertVersion';
// import { ErrorHandler } from './src/component/ErrorHandler';

// async function requestUserPermission() {
//   const authStatus = await messaging().requestPermission();
//   const enabled =
//     authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
//     authStatus === messaging.AuthorizationStatus.PROVISIONAL;

//   if (enabled) {
//     console.log('Authorization status:', authStatus);
//   }
// }

// export default function App({ navigation }) {

//   const isLoggedIn = useSelector(selectIsLoggedIn)
//   const isLoading = useSelector(selectIsLoading)
//   const user = useSelector(selectUserCurrentSession)
//   const dispatch = useDispatch()
//   const [modalVersionIsVisible, setmodalVersionIsVisible] = useState(false)

//   requestUserPermission()

//   useEffect(() => {
//     const init = async () => {
//       try {
//         const config = await restoreLocalConfigAsync()
//         const check = await checkVersion({
//           version: Constants.manifest.version, // app local version
//           //version: '1.1.0', // app local version
//           iosStoreURL: 'https://apps.apple.com/us/app/orthomaster/id1644851864',
//           androidStoreURL: 'https://play.google.com/store/apps/details?id=com.hugotaieb.OrthoMaster&pli=1',
//           country: 'jp', // default value is 'jp'
//         });
//         dispatch(checkUserConnection(config))
//         if (check.result === 'new') {
//           setmodalVersionIsVisible(true)
//         }
//       } catch (e) {
//         Alert.alert('Oups...', "Nous n'arrivons pas à accéder à internet.")
//       }
//     };
//     init();
//   }, []);




//   return (
//       <ErrorHandler>
//         <QueryClientProvider client={OmQueryClient}>
//           <NavigationContainer>

//             {
//               isLoggedIn && user.enabled == 1 ? (
//                 <AppTab />
//               ) : isLoading
//                 ? (
//                   <LoadingContent />
//                 ) : (
//                   <AuthStack />
//                 )}
//             <AlertVersion isVisible={modalVersionIsVisible} onClose={() => setmodalVersionIsVisible(false)} />
//           </NavigationContainer>
//         </QueryClientProvider>
//       </ErrorHandler>
//   );
// }


import { useState, useEffect, useRef } from 'react';
import { Text, View, Button, Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import { Alert } from 'react-native';

import { AppTab } from './src/navigation/AppTab';
import { AuthStack } from './src/navigation/stacks/AuthStack';
import { LoadingContent } from './src/component/LoadingContent';
import { AlertVersion } from './src/component/AlertVersion';
import { ErrorHandler } from './src/component/ErrorHandler';
import 'react-native-gesture-handler';


// Can use this function below OR use Expo's Push Notification Tool from: https://expo.dev/notifications
async function sendPushNotification(expoPushToken) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: 'Original Title',
    body: 'And here is the body!',
    data: { someData: 'goes here' },
  };

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
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-around' }}>
      <Text>Your expo push token: {expoPushToken}</Text>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text>Title: {notification && notification.request.content.title} </Text>
        <Text>Body: {notification && notification.request.content.body}</Text>
        <Text>Data: {notification && JSON.stringify(notification.request.content.data)}</Text>

        <Text>{Constants.manifest.extra.env.API_URL}</Text>
      </View>
      <Button
        title="Press to Send Notification"
        onPress={async () => {
          await sendPushNotification(expoPushToken);
        }}
      />
    </View>
  );
}
