import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";

let API_URL = "http://orthomasterapi-lb-1130920879.eu-west-1.elb.amazonaws.com/progress"


export const postUserLessonStatus = async (obj) => {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.accessToken;

    const body = {
        status: obj.status,
        content_id: obj.id
    }
    return axios
        .post(API_URL + "/user/" + config.user.id_user, body, {
            headers: { Authorization: authHeader },
        })
        .then((response) => {
            return response;
        });
}

export const getUserProgression = async () => {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.accessToken;
  
    return axios
      .get(API_URL+"/user/"+config.user.id_user, {
        headers: { Authorization: authHeader },
  
      })
      .then((response) => {
        return response.data;
      });
  }

  export const getCollaboratorsProgression = async (officeId) => {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.accessToken;
  
    return axios
      .get(API_URL+"/office/" + officeId + "/collaborators", {
        headers: { Authorization: authHeader },
  
      })
      .then((response) => {
        return response.data;
      });
  }

  export const getOfficeProgression = async (officeId) => {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.accessToken;
  
    return axios
      .get(API_URL+"/office/"+officeId, {
        headers: { Authorization: authHeader },
  
      })
      .then((response) => {
        return response.data;
      });
  }




         