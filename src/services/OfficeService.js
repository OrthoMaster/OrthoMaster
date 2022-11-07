import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";
import {API_URL} from '@env'

let route = API_URL+"/office"


export const getOfficeInfos = async (officeId) => {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.accessToken;
  
    return axios
      .get(route+"/"+officeId, {
        headers: { Authorization: authHeader },
      })
      .then((response) => {
        return response.data;
      })
      .catch((e)=> {
        Sentry.Native.captureException(e);
      });
  }
