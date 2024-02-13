import { useState, useEffect, useRef } from 'react';
import { Text, View, Button, Platform, SafeAreaView } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});





export const NotificationHandler = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  const handleNotif = (redirect) => {
    console.log("redirect", redirect);
    // if (redirectContent != null) {
    //   let rootView = ''
    //   let screenView = ''
    //   switch (redirectContent.type) {
    //     case 'lesson':
    //       rootView = 'Formation'
    //       screenView = 'formation-content'
    //       break;
    //     case 'flash':
    //       rootView = 'Flash ortho'
    //       screenView = 'flash-content-viewer'
    //       break;
    //     case 'qa':
    //       rootView = 'Accueil'
    //       screenView = 'home-content'
    //       break;
    //     default:
    //       rootView = 'Accueil'
    //       screenView = 'home-home'
    //       break;
    //   }
    //   console.log("RouteView:", rootView);
    //   console.log("ScreenView:", screenView);
      // nav.navigate(rootView, {
      //     screen: screenView,
      //     params: {
      //         content: redirectContent,
      //     },
      //     initial: false
      // });
      //nav.navigate()
    // } else {
    //   // nav.navigate('Accueil')
    // }
  }

  //Can use this function below or use Expo's Push Notification Tool from: https://expo.dev/notifications
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
      console.log("token",token);
    } else {
      alert('Must use physical device for Push Notifications');
    }

    return token.data;
  }


  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => { // triggered on notif reception
      console.log("notification listener");
      console.log(notification);
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => { // triggered while notification clicked
      console.log("response listener");
      handleNotif(response.notification.request.content.data)
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  // return children

  return (
    <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'space-around' }}>
      <Text>Your expo push token: {expoPushToken}</Text>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text>Title: {notification && notification.request.content.title} </Text>
        <Text>Body: {notification && notification.request.content.body}</Text>
        <Text>Data: {notification && JSON.stringify(notification.request.content.data)}</Text>
      </View>
      <Button
        title="Press to Send Notification"
        onPress={async () => {
          await sendPushNotification(expoPushToken);
        }}
      />
    </SafeAreaView>
  );
}

