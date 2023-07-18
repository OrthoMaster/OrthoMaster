import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";
import Constants from 'expo-constants';
let route = Constants.manifest.extra.env.API_URL+"/user"

export const changeUserPassword = async (passwords) => {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.JWT;

    const body = {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword,
        username: config.user.username
    }
    return axios
        .post(route + "/edit/password", body, {
            headers: { Authorization: authHeader },
        })
        .then((response) => {
            return response.data;
        })
        .catch((e)=> {
          throw e
        });
}

export const resetUserPassword = async (username) => {

  const body = {
      username: username
  }
  return axios
      .post(route + "/reset/password", body)
      .then((response) => {
          return response;
      })
      .catch((e)=> {
        throw e
      });
}

export const activateUser = async (username) => {

  const body = {
      username: username
  }
  return axios
      .post(route + "/activate", body)
      .then((response) => {
          return response.data;
      })
      .catch((e)=> {
        throw e
      });
}

export const getUsersByOfficeId = async (officeId) => {

    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.JWT;

    return axios
        .get(route + "/office",{
            headers: { Authorization: authHeader },
            params: {
                id: officeId
            }
        })
        .then((response) => {
            return response.data;
        })
        .catch((e)=> {
          throw e
        });
  }