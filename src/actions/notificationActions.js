import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

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

export const activateNotification = () => async (dispatch) => {
    console.log('holla');
    // dispatch({
    //     type: NOTIFICATION_REGISTER,
    //     payload:{
    //         isActive: finalToken != "" ? true : false
    //     }
    // })
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
