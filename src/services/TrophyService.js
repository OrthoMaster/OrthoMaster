import axios from "axios";

import { restoreLocalConfigAsync } from "../futils";
const baseurl = process.env.EXPO_PUBLIC_API_URL+"/trophy"


export const getTrophyProgressBasedOnModule = async (id_module) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;


  return axios
    .get(baseurl+"/user/"+config.user.id_user+'/trophy-progress/'+ id_module, {
      headers: { Authorization: authHeader },

    })
    .then((response) => {
      return response.data;
    })
}


export const getUserTrophy = async (id_user) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  const id = id_user != null ? id_user : config.user.id_user

  return axios
    .get(baseurl+"/user/"+ id, {
      headers: { Authorization: authHeader },

    })
    .then((response) => {
      return response.data;
    })
}

export const postNewUserTrophy = async (id_trophy) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;


  return axios
    .post(baseurl+"/user/"+config.user.id_user+"/trophy/"+id_trophy, {}, {
      headers: { Authorization: authHeader },
    })
    .then((response) => {
      return response.data;
    })
}