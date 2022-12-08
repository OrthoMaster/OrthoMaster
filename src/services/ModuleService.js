import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";
import Constants from 'expo-constants';
let route = Constants.manifest.extra.env.API_URL+"/modules"


export const fetchModulesWithUserProgression = async () => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.accessToken;


  return axios
    .get(route+"/user/"+config.user.id_user, {
      headers: { Authorization: authHeader },

    })
    .then((response) => {
      return response.data;
    })
    .catch((e)=> {
      throw e
    });
}