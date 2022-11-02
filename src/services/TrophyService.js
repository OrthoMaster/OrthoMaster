import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";
import {API_URL} from '@env'

let route = API_URL+"/trophy"


export const getTrophyProgressBasedOnModule = async (id_module) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.accessToken;


  return axios
    .get(route+"/user/"+config.user.id_user+'/trophy-progress/'+ id_module, {
      headers: { Authorization: authHeader },

    })
    .then((response) => {
      return response.data;
    });
}
export const getUserTrophy = async (id_user) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.accessToken;

  const id = id_user != null ? id_user : config.user.id_user

  return axios
    .get(route+"/user/"+ id, {
      headers: { Authorization: authHeader },

    })
    .then((response) => {
      return response.data;
    })
    .catch((e)=> {
      Sentry.Native.captureException(e);
    });
}

export const postNewUserTrophy = async (id_trophy) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.accessToken;


  return axios
    .post(route+"/user/"+config.user.id_user+"/trophy/"+id_trophy, {}, {
      headers: { Authorization: authHeader },
    })
    .then((response) => {
      return response.data;
    })
    .catch((e)=> {
      Sentry.Native.captureException(e);
    });
}