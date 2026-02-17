import axios from "axios";

import { restoreLocalConfigAsync } from "../futils";
const baseurl = process.env.EXPO_PUBLIC_API_URL + "/contents/v2/search"

export const fetchSearchList = async ({ contentType = null, filters = null, searchText = "" }, page, pageSize) => {

  // const config = await restoreLocalConfigAsync()
  // const authHeader = 'Bearer ' + config.JWT;
  return axios
    .get(baseurl, {
      // headers: { Authorization: authHeader },
      params: {
        pageSize: pageSize ? pageSize : 10,
        page: page,
        type: contentType,
        filters: filters,
        searchText: searchText,
        // user: config.user.id_user
        user: 1,
      }
    })
    .then((response) => {
      return response.data;
    })
    .catch((e) => {
      throw e;
    });
}
