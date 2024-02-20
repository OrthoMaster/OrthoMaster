import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform, View, Text } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useMutation } from 'react-query';
import { saveUserExpoPushToken } from '../services/NotificationService';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';


import AppModal from './AppModal';


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});



export const NotificationHandler = ({ children }) => {
  const [showModal, setShowModal] = useState(false)
  const [modalObj, setModalObj] = useState(null)
  const notificationListener = useRef();
  const responseListener = useRef();
  const lastNotificationResponse = Notifications.useLastNotificationResponse();
  const nav = useNavigation()
  const savePushToken = useMutation(saveUserExpoPushToken)

  const handleNotif = (redirect) => {
    console.log("REDIRECT OBJ :", redirect);
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

        rootView = 'Accueil'
        screenView = 'home-content'
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
    console.log("Register for push notif");
    registerForPushNotificationsAsync().then(token => {
      SecureStore.setItemAsync("expoPushToken", token)
      savePushToken.mutate(token)
    });

    // notificationListener.current = Notifications.addNotificationReceivedListener(response => { // triggered on notif reception
    //   //console.log("setModalObj", response.request.content.data.modal);
    //   // setNotification(notification);
    // });

    // responseListener.current = Notifications.addNotificationResponseReceivedListener(response => { // triggered while notification clicked
    //   setShowModal(true)
    //   setModalObj(response.notification.request.content.data.modal)
    //   handleNotif(response.notification.request.content.data.redirect)

    // });
    // Notifications.getLastNotificationResponseAsync()
    //   .then(response => {
    //     console.log(response);
    //     if (response?.notification) {
    //       setShowModal(true)
    //       setModalObj(response.notification.request.content.data.modal)
    //       handleNotif(response.notification.request.content.data.redirect)
    //     }
    //   })

    return () => {
      // Notifications.removeNotificationSubscription(notificationListener.current);
      // Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  useEffect(() => {
    if (
      lastNotificationResponse &&
      lastNotificationResponse.notification.request.content.data &&
      lastNotificationResponse.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER
    ) {

      console.log("LAST NOTIF RES :", lastNotificationResponse.notification.request.content.data);
      setModalObj(lastNotificationResponse.notification.request.content.data.modal)
      setShowModal(true)
      handleNotif(lastNotificationResponse.notification.request.content.data.redirect)
    }

  }, [lastNotificationResponse])


  return (<View style={{ height: "100%" }}>
    {children}
    <AppModal
      isVisible={modalObj != null && showModal}
      customRender={<View style={{
        width: "90%",
        paddingHorizontal: 20, paddingBottom: 10,
        alignItems: 'center'
      }}>
        <Text style={{
          fontWeight: "bold",
          fontSize: 16,
          color: "#eb7b0f",
          textAlign: 'center',
          paddingHorizontal: 20
        }}>{modalObj?.title}</Text>
        <Text style={{ marginTop: 20 }}>{modalObj?.text}</Text>
      </View>}
      onClose={() => {
        console.log("close notif modal");
        setShowModal(false)
        setModalObj(null)
      }}
    />
  </View>
  );
}

