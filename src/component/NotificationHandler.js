import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useMutation } from 'react-query';
import { saveUserExpoPushToken } from '../services/NotificationService';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});





export const NotificationHandler = ({ children }) => {
  // const notificationListener = useRef();
  const responseListener = useRef();
  const nav = useNavigation()
  const savePushToken = useMutation(saveUserExpoPushToken)

  const handleNotif = (redirect) => {
    if (redirect == null) {
      nav.navigate('Accueil')
      return
    }
    switch (redirect.type) {
      case "page":
        nav.navigate(redirect.page)
        break;
      case "content":
        let rootView;
        let screenView;
        if (redirect.content.type == "lesson") {
          rootView = 'Formation'
          screenView = 'formation-content'
        } else {
          rootView = 'Accueil'
          screenView = 'home-content'
        }
        nav.navigate(rootView, {
          screen: screenView,
          params: {
            content: redirect.content,
          }
        })
        break;
      default:
        nav.navigate('Accueil')
        break;
    }
  }

  async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Activation des notifications indisponible');
        return;
      }
      token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig.extra.eas.projectId,
      });
    } else {
      alert('Must use physical device for Push Notifications');
    }

    return token.data;
  }


  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      SecureStore.setItemAsync("expoPushToken", token)
      savePushToken.mutate(token)
    });

    // notificationListener.current = Notifications.addNotificationReceivedListener(notification => { // triggered on notif reception
    //   console.log("notification listener");
    //   console.log(notification);
    //   // setNotification(notification);
    // });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => { // triggered while notification clicked
      handleNotif(response.notification.request.content.data.redirect)
    });

    return () => {
      // Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return (
    children
  );
}

