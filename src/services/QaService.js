import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";

const baseurl = process.env.EXPO_PUBLIC_API_URL+"/contents"

export const fetchQa = async (limit = 0) => {

  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .get(baseurl + '/qa', {
      headers: { Authorization: authHeader },
      params: {
        _limit: limit
      }
    })
    .then((response) => {
      return response.data;
    })

}
