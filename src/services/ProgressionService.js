import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";
import {API_URL} from '@env'

let route = API_URL+"/progress"


export const postUserLessonStatus = async (obj) => {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.accessToken;

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
        .catch((e)=> {
          Sentry.Native.captureException(e);
        });
}

export const getUserProgression = async () => {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.accessToken;
  
    return axios
      .get(route+"/user/"+config.user.id_user, {
        headers: { Authorization: authHeader },
  
      })
      .then((response) => {
        return response.data;
      })
      .catch((e)=> {
        Sentry.Native.captureException(e);
      });
  }

  export const getCollaboratorsProgression = async (officeId) => {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.accessToken;
  
    return axios
      .get(route+"/office/" + officeId + "/collaborators", {
        headers: { Authorization: authHeader },
  
      })
      .then((response) => {
        return response.data;
      })
      .catch((e)=> {
        Sentry.Native.captureException(e);
      });
  }

  export const getOfficeProgression = async (officeId) => {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.accessToken;
  
    return axios
      .get(route+"/office/"+officeId, {
        headers: { Authorization: authHeader },
  
      })
      .then((response) => {
        return response.data;
      })
      .catch((e)=> {
        Sentry.Native.captureException(e);
      });
  }
