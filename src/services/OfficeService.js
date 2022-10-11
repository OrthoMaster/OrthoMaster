import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";

let API_URL = "https://api.orthomaster.fr/office"


export const getOfficeInfos = async (officeId) => {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.accessToken;
  
    return axios
      .get(API_URL+"/"+officeId, {
        headers: { Authorization: authHeader },
      })
      .then((response) => {
        return response.data;
      })
      .catch((e)=> {
        Sentry.Native.captureException(e);
      });
  }
