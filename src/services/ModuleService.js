import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";
const baseurl = process.env.EXPO_PUBLIC_API_URL+"/modules"


export const fetchModules = async ({idFormation}) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;


  return axios
    .get(baseurl+"/user/"+config.user.id_user, {
      headers: { Authorization: authHeader },
      params: {
        id_formation: idFormation
      }

    })
    .then((response) => {
      return response.data;
    })
    .catch((e)=> {
      throw e
    });
}