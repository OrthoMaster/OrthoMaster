import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";

const baseurl = process.env.EXPO_PUBLIC_API_URL+ "/medias"


export const fetchLastReleaseMedias = async (params = {
  limit,
  group_by
}) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;


  return axios
    .get(baseurl + "/", {
      headers: {
        Authorization: authHeader
      },
      params: params
    })
    .then((response) => {
      return response.data;
    })

}

export const fetchMediaByCategories = async () => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;


  return axios
    .get(baseurl + "/", {
      headers: { Authorization: authHeader },
      params: {
        group_by: "category"
      }
    })
    .then((response) => {
      
      return response.data;
    })
}