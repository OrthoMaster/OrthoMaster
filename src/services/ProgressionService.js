import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";
import Constants from 'expo-constants';
let route = Constants.manifest.extra.env.API_URL+"/progress"


export const postUserLessonStatus = async (obj) => {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.JWT;

    const body = {
        status: obj.status,
        content_id: obj.id
    }
    return axios
        .post(route + "/user/" + config.user.id_user, body, {
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
      .get(route+"/user/"+config.user.id_user, {
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
      .get(route+"/office/" + officeId + "/collaborators", {
        headers: { Authorization: authHeader },
  
      })
      .then((response) => {
        return response.data;
      })
      
  }

  export const getOfficesProgressionForManager = async (managerId) => {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.JWT;
  
    return axios
      .get(route+"/offices", {
        headers: { Authorization: authHeader },
        params:{
          manager_id: managerId
        }
  
      })
      .then((response) => {
        return response.data;
      })
      
  }
