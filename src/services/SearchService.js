import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";
const baseurl = process.env.EXPO_PUBLIC_API_URL+"/contents/v2/search"

export const fetchSearchList = async ({ contentType = null, filters = null, searchText = "" }, page) => {

  
  const config = await restoreLocalConfigAsync()

  const authHeader = 'Bearer ' + config.JWT;
  console.log(contentType);
  

  return axios
    .get(baseurl, {
      headers: { Authorization: authHeader },
      params: {
        pageSize: page ? 10 : null,
        page: page,
        type: contentType,
        filters: filters,
        searchText: searchText,
        user: config.user.id_user
      }
    })
    .then((response) => {
      return response.data;
    })
    .catch((e)=> {
      //console.log('search err', e.response);
      throw e
    });
}
