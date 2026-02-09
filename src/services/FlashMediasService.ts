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

  console.log(params);

  return axios
    .get(baseurl + "/", {
      // headers: {
      //   Authorization: authHeader
      // },
      params: params
    })
    .then((response) => {
      console.log(response.data);
      return response.data;
    })

}
