import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";

const baseurl = process.env.EXPO_PUBLIC_API_URL+"/formation"

export const getFormationMainQuizStatus = async (id_formation) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .get(baseurl+"/"+ id_formation +"/user/"+config.user.id_user, {
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
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .post(baseurl+"/"+ data.formation_id +"/user/"+config.user.id_user+"/new/"+data.quiz_type, null, {
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
  const authHeader = 'Bearer ' + config.JWT;

  const body = {
    status: 1,
    score: data.score
  }

  return axios
    .post(baseurl+"/"+ data.formation_id +"/user/"+config.user.id_user+"/update/"+data.quiz_type, body, {
      headers: { Authorization: authHeader },
    })
    .then((response) => {
      return response.data;
    })
}

export const getUserRegisteredFormation = async () => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .get(baseurl+"/user", {
      headers: { Authorization: authHeader },
      params: {
        id_user: config.user.id_user
      }
    })
    .then((response) => {
      return response.data;
    })
}


export const getFormations = async () => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .get(baseurl+"/", {
      headers: { Authorization: authHeader }
    })
    .then((response) => {
      return response.data;
    })
};


export const registerAsFormationDemo = async ({id_formation, formation_name}) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  const body = {
    id_formation: id_formation,
    formation_name: formation_name,
    id_user: config.user.id_user
  }

  return axios
    .post(baseurl+"/create", body, {
      headers: { Authorization: authHeader },
    })
    .then((response) => {
      return response.data;
    })
}