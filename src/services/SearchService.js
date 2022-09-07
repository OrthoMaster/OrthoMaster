import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";


const API_URL = "http://orthomasterapi-lb-1130920879.eu-west-1.elb.amazonaws.com/contents/search";

export const fetchSearchList = async ({ contentType = null, filters = null, body = null, searchText = "" }, page) => {

  const config = await restoreLocalConfigAsync()

  const authHeader = 'Bearer ' + config.accessToken;

  return axios
    .get(API_URL, {
      headers: { Authorization: authHeader },
      params: {
        pageSize: page ? 10 : null,
        page: page,
        type: contentType,
        filters: filters,
        body: body,
        searchText: searchText
      }
    })
    .then((response) => {
      return response.data;
    });
}
