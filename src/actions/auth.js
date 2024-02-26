import {
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  LOGOUT,
  REFRESH_SESSION,
  START_INTRO,
  STOP_INTRO
} from "./types";

import AuthService from "../services/AuthService";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export const login = (username, password) => async (dispatch) => {
  try {
    const data = await AuthService.login(username, password);
    if (data) {
      AsyncStorage.setItem('user', JSON.stringify(data.user), (error) => {
        if (error)
          throw error
      })
      await SecureStore.setItemAsync('JWT', data.token.jwt_token)
      await SecureStore.setItemAsync('refreshToken', data.token.refresh_token)
    }

    dispatch({
      type: LOGIN_SUCCESS,
      payload: { user: data.user },
    });
  } catch (e) {
    dispatch({
      type: LOGIN_FAIL,
      payload: { msg: e.response.data?.message }
    });
    throw e
  }
};


export const logout = () => (dispatch) => {
  AuthService.logout();
  dispatch({
    type: LOGOUT,
  });
};


export const refreshUserSession = (user) => async (dispatch) => {
  try {
    AsyncStorage.setItem('user', JSON.stringify(user)).catch(e=>{
    dispatch({
      type: LOGIN_FAIL,
      payload: { msg: "Impossible de retrouver l'utilisateur" }
    });
    })
    dispatch({
      type: REFRESH_SESSION,
      payload: { user: user }
    })
  } catch (error) {
    dispatch({
      type: LOGIN_FAIL,
      payload: { msg: "Impossible de retrouver l'utilisateur" }
    });
  }
}

export const startIntro = () => (dispatch) => {
  dispatch({
    type: START_INTRO
  })
}

export const stopIntro = () => (dispatch) => {
  dispatch({
    type: STOP_INTRO
  })
}
