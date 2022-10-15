import axios from "axios";
import { LOGIN_FAIL } from "../actions/types";

import { restoreLocalConfigAsync } from "../utils";

let API_URL = "http://localhost/user"


export const changeUserPassword = async (passwords) => {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.accessToken;

    const body = {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword,
        username: config.user.username
    }
    return axios
        .post(API_URL + "/edit/password", body, {
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
  const config = await restoreLocalConfigAsync()

  const body = {
      username: username
  }
  return axios
      .post(API_URL + "/edit/password", body)
      .then((response) => {
        console.log(response);
          return response;
      })
      .catch((e)=> {
        throw new Error(e)
      });
}




         