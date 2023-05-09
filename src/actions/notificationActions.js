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



export const sendNotification = (notif) => (dispatch) => {
    dispatch({
        type: NOTIFICATION_SEND
    })
}

export const registerForNotification = () => async (dispatch) => {
    let finalToken = "";
    let finalStatus;

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        finalStatus = existingStatus;
        console.log(finalStatus);

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
            console.log(status);
            console.log(finalStatus);
        }


        if (finalStatus == 'granted') {
            finalToken = (await Notifications.getDevicePushTokenAsync()).data;
            console.log(finalToken);
        }
    }

    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }
    if (finalToken != "") {
        const req = await registerUserToNotification(finalToken)
            
        console.log(req);
    }

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
