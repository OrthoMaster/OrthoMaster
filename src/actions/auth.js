import {
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  LOGOUT,
  SET_MESSAGE,
  TOKEN_INVALID,
  TOKEN_VALID,
} from "./types";

import AuthService from "../services/AuthService";


export const login = (username, password) => async (dispatch) => {
  try {
    const data = await AuthService.login(username, password);
    dispatch({
      type: LOGIN_SUCCESS,
      payload: { user: data.user },
    });
    return await Promise.resolve();
  } catch (e) {
    dispatch({
      type: LOGIN_FAIL,
      payload: { msg: e.response.data.msg }
    });
  }
};


export const logout = () => (dispatch) => {
  AuthService.logout();
  dispatch({
    type: LOGOUT,
  });
};

export const checkUserConnection = (config) => async (dispatch) => {
  if (config.JWT == null) {
    dispatch({
      type: TOKEN_INVALID
    })
    return
  }

  AuthService.checkUserConnection(config.JWT).then(
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
