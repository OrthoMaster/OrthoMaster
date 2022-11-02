import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";
import {API_URL} from '@env'

let route = API_URL+"/user"

console.log(route);

export const changeUserPassword = async (passwords) => {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.accessToken;

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
          throw new Error(e)
        });
}

export const resetUserPassword = async (username) => {

  const body = {
      username: username
  }
  return axios
      .post(route + "/reset/password", body)
      .then((response) => {
        console.log(response);
          return response;
      })
      .catch((e)=> {
        throw new Error(e)
      });
}

export const activateUser = async (username) => {
  const config = await restoreLocalConfigAsync()

  const body = {
      username: username
  }
  return axios
      .post(route + "/activate", body)
      .then((response) => {
          return response.data;
      })
      .catch((e)=> {
        throw new Error(e)
      });
}




         