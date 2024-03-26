import axios from "axios";

import { restoreLocalConfigAsync } from "../../utils";

const baseurl = process.env.EXPO_PUBLIC_API_URL + "/tools/que-choisir"

export const getQueChoisir = async () => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .get(baseurl + "/get", {
      headers: {
        Authorization: authHeader
      }
    })
    .then((response) => {
      return response.data;
    })

}

