import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { registerUserToNotification } from "../services/NotificationService";
import {
    NOTIFICATION_CLEAR,
    NOTIFICATION_RECEIVED,
    NOTIFICATION_REGISTER,
    NOTIFICATION_SEND
} from "./types";



Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });




export const sendNotification = (notif) => (dispatch) => {
    dispatch({
        type: NOTIFICATION_SEND
    })
}

export const registerForNotification = () => async (dispatch) => {
    let finalToken = "";
    let finalStatus;
    let oldPushToken = await AsyncStorage.getItem('pushToken', (error, result) => {
        if (error) {
            throw error
        }
        return result
    })

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        finalStatus = existingStatus;

        if (existingStatus !== 'granted' && existingStatus != 'denied') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }


        if (finalStatus == 'granted') {
            finalToken = (await Notifications.getDevicePushTokenAsync()).data;
        }
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


    console.log('old', oldPushToken);
    console.log('new', finalToken);
    if (finalToken != oldPushToken && finalStatus == "granted") {
        AsyncStorage.setItem('pushToken', finalToken, (error) => {
            if (error)
                throw error
        })

        await registerUserToNotification(finalToken)
            .then((value) => {
                console.log("val:",value);
            })
    }

    console.log("dispatch");
    dispatch({
        type: NOTIFICATION_REGISTER,
        payload:{
            isActive: finalToken != "" ? true : false
        }
    })
}

export const receiveNotification = (notif) => (dispatch) => {
    dispatch({
        type: NOTIFICATION_RECEIVED,
        payload: { notification: notif }
    })
}

export const clearNotification = () => (dispatch) => {
    dispatch({
        type: NOTIFICATION_CLEAR
    })
}
