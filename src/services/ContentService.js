import axios from "axios";

import { restoreLocalConfigAsync, S3ContentPathGenerator } from "../futils";
import { getS3XML } from '../services/S3Service'

const baseurl = process.env.EXPO_PUBLIC_API_URL+"/contents"


export const fetchLessonByModuleWithProgression = async (idModule) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .get(baseurl + "/module/" + idModule + "/user/" + config.user.id_user, {
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

export const getNextLesson = async (currentModule, currentOrder, id_formation) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .get(baseurl + "/v2/lesson/next", {
      headers: { Authorization: authHeader },
      params: {
        currentModule: currentModule,
        currentOrder: currentOrder,
        currentFormation: id_formation
      }
    })
    .then((response) => {
      return response.data;
    })
    .catch(e=>{
    })
}

export const getUserNextLesson = async () => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .get(baseurl + "/user/" + config.user.id_user + "/nextLesson", {
      headers: { Authorization: authHeader }
    })
    .then((response) => {
      return response.data;
    })
}

export const getCdnContentAccessUrl = async (path) => {
  // const config = await restoreLocalConfigAsync()
  // const authHeader = 'Bearer ' + config.JWT;

  return axios
  .get(baseurl + "/cdn/", {
    // headers: { Authorization: authHeader },
    params: {
      path: path
    }
  })
  .then((response) => {
    return response.data;
  })
}

export const getContentById = async (idContent) => {
  // const config = await restoreLocalConfigAsync()
  // const authHeader = 'Bearer ' + config.JWT;

  return axios
    .get(baseurl + "/get" , {
      // headers: { Authorization: authHeader },
      params: {
        ic: idContent
      }
    })
    .then((response) => {
      return response.data;
    })
    .catch((e)=> {
      throw e
    });
}