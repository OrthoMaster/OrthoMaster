import {
    REGISTER_SUCCESS,
    REGISTER_FAIL,
    LOGIN_SUCCESS,
    LOGIN_FAIL,
    LOGOUT,
    TOKEN_VALID,
    TOKEN_INVALID,
} from "../actions/types";



//const user = JSON.parse(localStorage.getItem("user"));


//const user = null

// const initialState = user
//     ? { isLoggedIn: true, user }
//     : { isLoggedIn: false, user: null };

const initialState = {
    isLoggedIn: false,
    userTopAccount: null,
    userCurrentSession: null,
    isLoading: true,
    authMessage: ""
}


export const selectIsLoggedIn = state => state.auth.isLoggedIn
export const selectIsLoading = state => state.auth.isLoading
export const selectAccessToken = state => state.auth.accessToken
export const selectAuthMessage = state => state.auth.authMessage
export const selectUserCurrentSession = state => state.auth.userCurrentSession


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
                accessToken: null,
                isLoading: false
            };
        case TOKEN_VALID:
            return {
                ...state,
                isLoggedIn: true,
                userTopAccount: payload.user,
                userCurrentSession: payload.user,
            };
        case TOKEN_INVALID:
            return {
                ...state,
                isLoggedIn: false,
                userTopAccount: null,
                userCurrentSession: null,
                isLoading: false
            };
        default:
            return state;
    }
}
