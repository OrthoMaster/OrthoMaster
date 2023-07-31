import {
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  LOGOUT,
  SET_MESSAGE,
  TOKEN_INVALID,
  TOKEN_VALID,
} from "./types";

import AuthService from "../services/AuthService";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { restoreLocalConfigAsync } from "../utils";


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

    let user = data.user
    // user.roles = user.roles.split(',')
    dispatch({
      type: LOGIN_SUCCESS,
      payload: { user: user },
    });
  } catch (e) {
    dispatch({
      type: LOGIN_FAIL,
      payload: { msg: e.response.data.message }
    });
  }
};


export const logout = () => (dispatch) => {
  AuthService.logout();
  dispatch({
    type: LOGOUT,
  });
};


export const checkToken = () => async (dispatch) => {
  const config = await restoreLocalConfigAsync()

  try {
    const res = await AuthService.checkUserConnection(config.JWT)
    if (res.status == 200) {
      dispatch({
        type: LOGIN_SUCCESS,
        payload: {user: config.user}
      })
    }

  } catch (error) {
    dispatch({
      type: LOGIN_FAIL,
      payload: { msg: '' }
    })
    
  }
}