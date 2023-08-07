import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";
import Constants from 'expo-constants';
let route = Constants.manifest.extra.env.API_URL+"/office"



export const getOfficeInfos = async (officeId) => {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.JWT;
    console.log('herre too');
    return axios
      .get(route+"/"+officeId, {
        headers: { Authorization: authHeader },
      })
      .then((response) => {
        return response.data;
      })
      .catch((e)=> {
        throw e
      });
  }

  export const getOfficeByManager = async () => {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.JWT;
  
    return axios
      .get(route+"/manager/"+config.user.id_user, {
        headers: { Authorization: authHeader }
      })
      .then((response) => {
        return response.data;
      })
      .catch((e)=> {
        throw e
      });
  }

  export const getOfficeInvitationToken = async (officeId) => {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.JWT;
  
    return axios
      .get(route+"/invitation-token/"+officeId, {
        headers: { Authorization: authHeader }
      })
      .then((response) => {
        return response.data;
      })
      .catch((e)=> {
        throw e
      });
  }