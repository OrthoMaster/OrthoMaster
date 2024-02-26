import {
    LOGIN_SUCCESS,
    LOGIN_FAIL,
    LOGOUT,
    REFRESH_SESSION,
    START_INTRO,
    STOP_INTRO
} from "../actions/types";


const initialState = {
    isLoggedIn: false,
    userTopAccount: null,
    userCurrentSession: null,
    authMessage: "",
    displayIntro: false
}


export const selectIsLoggedIn = state => state.auth.isLoggedIn
export const selectAuthMessage = state => state.auth.authMessage
export const selectUserCurrentSession = state => state.auth.userCurrentSession
export const selectDisplayIntro = state => state.auth.displayIntro


export const authReducer = (state = initialState, action) => {
    const { type, payload } = action;
    switch (type) {
        case LOGIN_SUCCESS:
            return {
                ...state,
                isLoggedIn: true,
                userTopAccount: payload.user,
                userCurrentSession: payload.user,
                authMessage: ""
            };

        case REFRESH_SESSION:
            return {
                ...state,
                isLoggedIn: true,
                userTopAccount: payload.user,
                userCurrentSession: payload.user,
                authMessage: ""
            };
        case LOGIN_FAIL:
            return {
                ...state,
                isLoggedIn: false,
                userTopAccount: null,
                userCurrentSession: null,
                authMessage: payload.msg
            };
        case LOGOUT:
            return {
                ...state,
                isLoggedIn: false,
                userTopAccount: null,
                userCurrentSession: null,
                accessToken: null
            };
            case START_INTRO: 
            return {
                ...state,
                displayIntro: true
            }
            case STOP_INTRO: 
            return {
                ...state,
                displayIntro: false
            }
        default:
            return state;
    }
}
