import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";

import {API_URL} from '@env'

const route = API_URL+"/contents/search"

export const fetchSearchList = async ({ contentType = null, filters = null, body = null, searchText = "" }, page) => {

  const config = await restoreLocalConfigAsync()

  const authHeader = 'Bearer ' + config.accessToken;

  return axios
    .get(route, {
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
    })
    .catch((e)=> {
      Sentry.Native.captureException(e);
    });
}
