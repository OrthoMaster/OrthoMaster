import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";
const baseurl = process.env.EXPO_PUBLIC_API_URL



export const getOfficeInfos = async (officeId) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;
  return axios
    .get(baseurl + "/office/" + officeId, {
      headers: { Authorization: authHeader },
    })
    .then((response) => {
      return response.data;
    })
    .catch((e) => {
      throw e
    });
}

export const getOfficeByManager = async () => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .get(baseurl + "/office/manager/" + config.user.id_user, {
      headers: { Authorization: authHeader }
    })
    .then((response) => {
      return response.data;
    })
    .catch((e) => {
      throw e
    });
}

export const getOfficeInvitationToken = async (officeId) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .get(baseurl + "/office/invitation-token/" + officeId, {
      headers: { Authorization: authHeader }
    })
    .then((response) => {
      return response.data;
    })
    .catch((e) => {
      throw e
    });
}

export const removeUserFromAccount = async (userId) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .post(baseurl+"/office/remove-user/"+userId, {}, {
      headers: { Authorization: authHeader }
    })
    .then((response) => {
      return response;
    })
    .catch((e)=> {
      throw e
    });
}

export const sendActivationLink = async (username) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;


  return axios
    .post(baseurl + "/user/activation-link/", {
      username: username
    }, {
      headers: { Authorization: authHeader }
    })
    .then((response) => {
      return response.data;
    })
    .catch((e) => {
      throw e
    });
}