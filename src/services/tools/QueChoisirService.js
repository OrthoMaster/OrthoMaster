import axios from "axios";

import { restoreLocalConfigAsync } from "../../utils";
import { getS3XML } from '../S3Service'
import Constants from 'expo-constants';

let route = Constants.manifest.extra.env.API_URL + "/tools/que-choisir"

export const getAPIqueChoisirStep = async (category) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .get(route + "/step", {
      headers: {
        Authorization: authHeader
      },
      params: {
        category: category
      }
    })
    .then((response) => {
      return response.data;
    })

}

export const getAPIqueChoisirRedFlags = async (category) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .get(route + "/redflags", {
      headers: {
        Authorization: authHeader
      },
      params: {
        category: category
      }
    })
    .then((response) => {
      return response.data;
    })

}

export const getQCcategories = async () => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .get(route + "/categories", {
      headers: {
        Authorization: authHeader
      }
    })
    .then((response) => {
      return response.data;
    })

}

