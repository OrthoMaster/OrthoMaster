import { useState, useEffect, useRef, useCallback } from "react";
import * as Notifications from 'expo-notifications';
import { useDispatch } from "react-redux";
import { registerForNotification } from "../actions/notificationActions";

import { useNavigation } from "@react-navigation/native";


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});


export const NotificationHandler = ({ children }) => {
  //const notificationListener = useRef();
  const responseListener = useRef();
  const nav = useNavigation()

  const dispatch = useDispatch()


  const handleNotif = (redirectContent) => {
    if (redirectContent != null) {
      let rootView = ''
      let screenView = ''
      switch (redirectContent.type) {
        case 'lesson':
          rootView = 'Formation'
          screenView = 'formation-content'
          break;
        case 'flash':
          rootView = 'Flash ortho'
          screenView = 'flash-content-viewer'
          break;
        case 'qa':
          rootView = 'Accueil'
          screenView = 'home-content'
          break;
        default:
          rootView = 'Accueil'
          screenView = 'home-home'
          break;
      }
      nav.navigate(rootView, {
          screen: screenView,
          params: {
              content: redirectContent,
          },
          initial: false
      });
      //nav.navigate()
    } else {
      nav.navigate('Accueil')
    }
  }

  const getNotifDataByPlatform = (notification) => {
    if (notification.request.trigger.payload) {
      handleNotif(notification.request.trigger.payload.redirect_content)
    } else if (notification.request.trigger.remoteMessage) {
      handleNotif(JSON.parse(notification.request.trigger.remoteMessage.data.body).redirect_content)
    } else {
      console.log('Undefined');
    }
  }

  useEffect(() => {
    dispatch(registerForNotification())


    // Notifications.getBadgeCountAsync().then((val)=>(console.log(val)))
    Notifications.setBadgeCountAsync(0)

    
    // notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
    //   console.log('notif received'); //notif received while navigatng in the app
    //   console.log(notification.request);
    // });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      // triggered while the notif has been clicked
      getNotifDataByPlatform(response.notification)
    });

    return () => {
      //Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);


  return children
}

