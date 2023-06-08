import axios from "axios";

import { restoreLocalConfigAsync } from "../../utils";
import { getS3XML } from '../S3Service'
import Constants from 'expo-constants';

let route = Constants.manifest.extra.env.API_URL + "/tools/queChoisir"

export const getAPIqueChoisirStep = async (questionRef, tool) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .get(route + "/step", {
      headers: {
        Authorization: authHeader
      },
      params: {
        ref: questionRef,
        tool: tool
      }
    })
    .then((response) => {
      return response.data;
    })

}

export const getAPIqueChoisirRedFlags = async (tool) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .get(route + "/redflags", {
      headers: {
        Authorization: authHeader
      },
      params: {
        tool: tool
      }
    })
    .then((response) => {
      return response.data;
    })

}

