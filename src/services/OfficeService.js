import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";
import Constants from 'expo-constants';
import * as Sentry from 'sentry-expo'
let route = Constants.manifest.extra.env.API_URL+"/office"


export const getOfficeInfos = async (officeId) => {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.accessToken;
  
    return axios
      .get(route+"/"+officeId, {
        headers: { Authorization: authHeader+'i' },
      })
      .then((response) => {
        return response.data;
      })
      .catch((e)=> {
        Sentry.Native.captureException(e)
      });
  }
