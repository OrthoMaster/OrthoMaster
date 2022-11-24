import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";
import { getS3XML } from '../services/S3Service'
import Constants from 'expo-constants';

let route = Constants.manifest.extra.env.API_URL+"/contents"

export const fetchQa = async (limit = 0) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.accessToken;

  return axios
    .get(route + '/qa', {
      headers: { Authorization: authHeader },
      params: {
        _limit: limit
      }
    })
    .then((response) => {
      return response.data;
    })
    .catch((e)=> {
      Sentry.Native.captureException(e);
    });
}

export const fetchFlash = async (filters, limit) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.accessToken;

  return axios
    .get(route + "/flash", {
      headers: { Authorization: authHeader },
      params: {
        _limit: limit,
        filters: filters
      }
    })
    .then((response) => {
      return response.data;
    })
    .catch((e)=> {
      Sentry.Native.captureException(e);
    });
}

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
      Sentry.Native.captureException(e);
    });
}

export const fetchLessonContent = async (content) => {
  let s3key
  if (content.type == 'lesson') {
    if (content.title == 'initial' || content.title == 'final') {
      s3key = content.type + '/' + content.title + '/content.xml'
    } else {
      s3key = content.type + '/' + content.module_num + '/' + content.title + '/content.xml'
    }
  } else {
    s3key = content.type + '/' + content.title + '/content.xml'
  }
  return await getS3XML(s3key)
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
    .catch((e)=> {
      Sentry.Native.captureException(e);
    });
}