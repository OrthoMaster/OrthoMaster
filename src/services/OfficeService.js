import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";
const baseurl = process.env.EXPO_PUBLIC_API_URL+"/office"



export const getOfficeInfos = async (officeId) => {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.JWT;
    console.log('herre too');
    return axios
      .get(baseurl+"/"+officeId, {
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
      .get(baseurl+"/manager/"+config.user.id_user, {
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
      .get(baseurl+"/invitation-token/"+officeId, {
        headers: { Authorization: authHeader }
      })
      .then((response) => {
        return response.data;
      })
      .catch((e)=> {
        throw e
      });
  }