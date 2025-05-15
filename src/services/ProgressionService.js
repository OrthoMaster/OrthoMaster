import axios from "axios";

import { restoreLocalConfigAsync } from "../futils";
const baseurl = process.env.EXPO_PUBLIC_API_URL + "/progress"


export const postUserLessonStatus = async (obj) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;
  
  const body = {
    status: obj.status,
    content_id: obj.id,
    id_user_registered_formation: obj.userFormation
  }
  
  return axios
    .post(baseurl + "/v2/user/" + config.user.id_user, body, {
      headers: { Authorization: authHeader },
    })
    .then((response) => {
      return response;
    })
}

export const getUserProgression = async () => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;
  
  return axios
    .get(baseurl + "/user/" + config.user.id_user, {
      headers: { Authorization: authHeader },

    })
    .then((response) => {
      return response.data;
    })

}

export const getCollaboratorsProgression = async (officeId) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .get(baseurl + "/office/" + officeId + "/collaborators", {
      headers: { Authorization: authHeader },

    })
    .then((response) => {
      return response.data;
    })

}
