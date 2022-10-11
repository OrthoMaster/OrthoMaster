import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";

let API_URL = "https://api.orthomaster.fr/modules"


export const fetchModulesWithUserProgression = async () => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.accessToken;


  return axios
    .get(API_URL+"/user/"+config.user.id_user, {
      headers: { Authorization: authHeader },

    })
    .then((response) => {
      return response.data;
    })
    .catch((e)=> {
      Sentry.Native.captureException(e);
    });
}