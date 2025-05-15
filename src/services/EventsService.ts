import axios, { Axios, AxiosResponse } from "axios";

import { restoreLocalConfigAsync } from "../futils";
import { IEvent, IPastEvent } from "../utils/interfaces";

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

type fetchPastEventParams = {
  eventID?: number;
}

export const fetchPastEvents = async (params : fetchPastEventParams) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;


  return axios
    .get<IPastEvent[]>(baseurl + "/past", {
      headers: {
        Authorization: authHeader
      },
      params
    })
    .then((response)=> {
      return response.data;
    })

}
