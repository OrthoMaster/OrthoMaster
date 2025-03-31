import axios, { Axios, AxiosResponse } from "axios";

import { restoreLocalConfigAsync } from "../utils";
import { IEvent } from "../interfaces";

const baseurl = process.env.EXPO_PUBLIC_API_URL+ "/events"


export const fetchEvents = async () => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;


  return axios
    .get<IEvent[]>(baseurl + "/", {
      headers: {
        Authorization: authHeader
      }
    })
    .then((response)=> {
      return response.data;
    })

}
