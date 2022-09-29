import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";

let API_URL = "https://api.orthomaster.fr/trophy"


export const getTrophyProgressBasedOnModule = async (id_module) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.accessToken;


  return axios
    .get(API_URL+"/user/"+config.user.id_user+'/trophy-progress/'+ id_module, {
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
    .get(API_URL+"/user/"+ id, {
      headers: { Authorization: authHeader },

    })
    .then((response) => {
      return response.data;
    });
}

export const postNewUserTrophy = async (id_trophy) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.accessToken;


  return axios
    .post(API_URL+"/user/"+config.user.id_user+"/trophy/"+id_trophy, {}, {
      headers: { Authorization: authHeader },
    })
    .then((response) => {
      return response.data;
    });
}