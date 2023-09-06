import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";

const baseurl = process.env.EXPO_PUBLIC_API_URL+ "/flash"

export const fetchFlashContent = async (subcategory_id = 0, limit = 0) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  let params = {}
  subcategory_id > 0 ? params.subcategory_id = subcategory_id : params
  limit > 0 ? params.limit = limit : params


  return axios
    .get(baseurl + "/content", {
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
    .get(baseurl + "/category", {
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
    .get(baseurl + "/subcategory", {
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