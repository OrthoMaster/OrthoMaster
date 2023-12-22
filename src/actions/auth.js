import {
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  LOGOUT,
  SET_MESSAGE,
  TOKEN_INVALID,
  TOKEN_VALID,
  REFRESH_SESSION
} from "./types";

import AuthService from "../services/AuthService";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export const login = (username, password) => async (dispatch) => {
  try {
    const data = await AuthService.login(username, password);
    if (data) {
      data.user.roles = data.user.roles?.split(',')
      data.user.labos = data.user.labos?.split(',')

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

  dispatch({
    type: REFRESH_SESSION,
    payload: { user: user }
  })
}
