import { useState, useEffect, useRef, useCallback } from "react";
import { Text, View, Button, Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useDispatch } from "react-redux";
import { registerForNotification } from "../actions/notificationActions";

// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: false,
//     shouldSetBadge: false,
//   }),
// });



// async function registerForPushNotificationsAsync() {
//     let token;
//     if (Device.isDevice) {
//       const { status: existingStatus } = await Notifications.getPermissionsAsync();
//       let finalStatus = existingStatus;
      
//       if (existingStatus !== 'granted' && existingStatus != 'denied') {
//         const { status } = await Notifications.requestPermissionsAsync();
//         finalStatus = status;
//       }
  
  
//       if (finalStatus == 'granted') {
//         token = (await Notifications.getDevicePushTokenAsync()).data;
//         return;
//       }
//     } else {
//       alert('Must use physical device for Push Notifications');
//     }
  
//     if (Platform.OS === 'android') {
//       Notifications.setNotificationChannelAsync('default', {
//         name: 'default',
//         importance: Notifications.AndroidImportance.MAX,
//         vibrationPattern: [0, 250, 250, 250],
//         lightColor: '#FF231F7C',
//       });
//     }
  
//     return token;
//   }

export const NotificationHandler = ({children}) => {
    const [devicePushToken, setDevicePushToken] = useState('');
    const [notification, setNotification] = useState(false);
    const notificationListener = useRef();
    const responseListener = useRef();

    const dispatch = useDispatch()


    useEffect(() => {
      //registerForPushNotificationsAsync().then(token => setDevicePushToken(token));
      dispatch(registerForNotification())
  
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log('notif received'); //notif received while navigatng in the app
        console.log(notification);
        setNotification(notification);
      });
  
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('clickeed'); // triggered while the notif has been clicked
        console.log(response);
        console.log(response.notification);
        console.log(response.notification.payload);
      });
  
      return () => {
        Notifications.removeNotificationSubscription(notificationListener.current);
        Notifications.removeNotificationSubscription(responseListener.current);
      };
    }, []);
  

    return children
}

