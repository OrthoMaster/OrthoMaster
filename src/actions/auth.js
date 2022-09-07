import {
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  LOGOUT,
  SET_MESSAGE,
  TOKEN_INVALID,
  TOKEN_VALID,
} from "./types";

import AuthService from "../services/AuthService";


export const login = (username, password) => (dispatch) => {
  return AuthService.login(username, password).then(
    (data) => {
      dispatch({
        type: LOGIN_SUCCESS,
        payload: { user: data.user, accessToken: data.accessToken },
      });
      return Promise.resolve();
    },
    (error) => {
      dispatch({
        type: LOGIN_FAIL,
        payload: { msg: error.response.data.msg}
      });
      return Promise.reject();
    }
  );
};


export const logout = () => (dispatch) => {
  AuthService.logout();
  dispatch({
    type: LOGOUT,
  });
};

export const checkUserConnection = (config) => (dispatch) => {
  if (!config) {
    dispatch({
      type: TOKEN_INVALID
    })
    return
  }

  AuthService.checkUserConnection(config).then(
    (data) => {
      dispatch({
        type: TOKEN_VALID,
        payload: { user: config.user }
      })
      return Promise.resolve();
    },
    (error) => {
      dispatch({
        type: TOKEN_INVALID
      })
    }
  )
}