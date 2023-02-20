import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";
import { getS3XML } from './S3Service'
import Constants from 'expo-constants';

let route = Constants.manifest.extra.env.API_URL+"/contents"

export const fetchQa = async (limit = 0) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.accessToken;

  return axios
    .get(route + '/qa', {
      headers: { Authorization: authHeader },
      params: {
        _limit: limit
      }
    })
    .then((response) => {
      return response.data;
    })
    .catch((e)=> {
      throw e
    });
}
