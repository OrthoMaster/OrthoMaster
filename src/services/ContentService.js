import axios from "axios";

import { restoreLocalConfigAsync, S3ContentPathGenerator } from "../utils";
import { getS3XML } from '../services/S3Service'
import Constants from 'expo-constants';

let route = Constants.manifest.extra.env.API_URL+"/contents"


export const fetchLessonByModuleWithProgression = async (idModule) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.accessToken;

  return axios
    .get(route + "/module/" + idModule + "/user/" + config.user.id_user, {
      headers: { Authorization: authHeader }
    })
    .then((response) => {
      return response.data;
    })
    .catch((e)=> {
      throw e
    });
}

export const fetchLessonContent = async (content) => {
  return await getS3XML(content)
}

export const getUserNextLesson = async () => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.accessToken;

  return axios
    .get(route + "/user/" + config.user.id_user + "/nextLesson", {
      headers: { Authorization: authHeader }
    })
    .then((response) => {
      return response.data;
    })
}