import {
    NOTIFICATION_RECEIVED,
    NOTIFICATION_SEND,
    NOTIFICATION_REGISTER,
    NOTIFICATION_CLEAR
} from "../actions/types";



const initialState = {
    isActive: false,
    badgeNumber: 0,
    notificationsArray: []
}



export const notificationReducer = (state = initialState, action) => {
    const { type, payload } = action;
    switch (type) {
        case NOTIFICATION_REGISTER:
            return { ...state, isActive: payload.isActive }
        case NOTIFICATION_SEND:
            return {
                ...state
            };
        case NOTIFICATION_RECEIVED:
            return {
                ...state,
                notificationsArray: [...state.notificationsArray, payload.notification],
                badgeNumber: badgeNumber + 1
            };
        case NOTIFICATION_CLEAR:
            return {
                ...state,
                badgeNumber: 0,
                notificationsArray: []
            };
        default:
            return state;
    }
}

