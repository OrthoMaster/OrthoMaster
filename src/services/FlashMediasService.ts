import axios from "axios";

import { restoreLocalConfigAsync } from "../futils";

const baseurl = process.env.EXPO_PUBLIC_API_URL+ "/medias"

type fetchMediasParams = {
  limit?: number;
  group_by?: string;
  event?: number;
}

export const fetchMedias = async (params?: fetchMediasParams) => {
  // const config = await restoreLocalConfigAsync()
  // const authHeader = 'Bearer ' + config.JWT;


  return axios
    .get(baseurl + "/", {
      // headers: {
      //   Authorization: authHeader
      // },
      params: params
    })
    .then((response) => {
      return response.data;
    })

}
