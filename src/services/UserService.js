import axios from "axios";

import { Buffer } from "buffer"
import { restoreLocalConfigAsync } from "../utils";
const baseurl = process.env.EXPO_PUBLIC_API_URL+"/user"


export const changeUserPassword = async (passwords) => {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.JWT;

    const body = {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword,
        username: config.user.username
    }
    return axios
        .post(baseurl + "/edit/password", body, {
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
      .post(baseurl + "/reset/password", body)
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
      .post(baseurl + "/activate", body)
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
        .get(baseurl + "/office",{
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


export const getCurrentUser = async () => {

    try {
        const config = await restoreLocalConfigAsync()
        const authHeader = 'Bearer ' + config.JWT;
        const parts = config.JWT.split('.').map((part) => Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'),'base64').toString());
        const userId = JSON.parse(parts[1]).id_user;
        return axios
            .get(baseurl + "/",{
                headers: { Authorization: authHeader },
                params: {
                    id_user: userId
                }
            })
            .then((response) => {
                return response.data;
            })
            .catch((e)=> {
              throw e
            });
        
    } catch (error) {
        return null
    }
  }