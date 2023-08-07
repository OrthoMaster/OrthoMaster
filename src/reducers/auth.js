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
    isLoading: true,
    userTopAccount: null,
    userCurrentSession: null,
    authMessage: ""
}


export const selectIsLoggedIn = state => state.auth.isLoggedIn
export const selectIsLoading = state => state.auth.isLoading
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
                authMessage: "",
                isLoading: false
            };
        case LOGIN_FAIL:
            return {
                ...state,
                isLoggedIn: false,
                userTopAccount: null,
                userCurrentSession: null,
                authMessage: payload.msg,
                isLoading: false
            };
        case LOGOUT:
            return {
                ...state,
                isLoggedIn: false,
                userTopAccount: null,
                userCurrentSession: null,
                accessToken: null
            };
        default:
            return state;
    }
}
