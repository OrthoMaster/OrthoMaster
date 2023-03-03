import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";
import Constants from 'expo-constants';

let route = Constants.manifest.extra.env.API_URL+"/formation"

export const getFormationMainQuizStatus = async (id_formation) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.accessToken;

  return axios
    .get(route+"/"+ id_formation +"/user/"+config.user.id_user, {
      headers: { Authorization: authHeader },
    })
    .then((response) => {
      return response.data;
    })
    .catch((e)=> {
      throw e
    });
}

export const insertMainQuizStatusByFormation = async (data) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.accessToken;

  return axios
    .post(route+"/"+ data.formation_id +"/user/"+config.user.id_user+"/new/"+data.quiz_type, null, {
      headers: { Authorization: authHeader },
    })
    .then((response) => {
      return response.data;
    })
    .catch((e)=> {
      throw e
    });
}

export const valideMainQuizStatusByFormation = async (data) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.accessToken;

  const body = {
    status: 1,
    score: data.score
  }

  return axios
    .post(route+"/"+ data.formation_id +"/user/"+config.user.id_user+"/update/"+data.quiz_type, body, {
      headers: { Authorization: authHeader },
    })
    .then((response) => {
      return response.data;
    })
    .catch((e)=> {
      throw e
    });
}