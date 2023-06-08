import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";
import { getS3XML } from './S3Service'
import Constants from 'expo-constants';

let route = Constants.manifest.extra.env.API_URL + "/flash"

export const fetchFlashContent = async (subcategory_id = 0, limit = 0) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  let params = {}
  subcategory_id > 0 ? params.subcategory_id = subcategory_id : params
  limit > 0 ? params.limit = limit : params


  return axios
    .get(route + "/content", {
      headers: {
        Authorization: authHeader
      },
      params: params
    })
    .then((response) => {
      return response.data;
    })

}

export const fetchFlashCategoriesByTheme = async (theme_id) => {

  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;


  return axios
    .get(route + "/category", {
      headers: { Authorization: authHeader },
      params: {
        theme_id: theme_id,
      }
    })
    .then((response) => {
      return response.data;
    })
    .catch((e) => {
      throw e
    });
}

export const fetchFlashSubcategoriesByCategory = async (category_id) => {

  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;


  return axios
    .get(route + "/subcategory", {
      headers: { Authorization: authHeader },
      params: {
        category_id: category_id,
      }
    })
    .then((response) => {
      return response.data;
    })
    .catch((e) => {
      throw e
    });
}