import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";

const baseurl = process.env.EXPO_PUBLIC_API_URL + "/formation"

export const getFormationMainQuizStatus = async (id_formation) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .get(baseurl + "/" + id_formation + "/user/" + config.user.id_user, {
      headers: { Authorization: authHeader },
    })
    .then((response) => {
      return response.data;
    })
    .catch((e) => {
      throw e
    });
}

export const insertMainQuizStatusByFormation = async (data) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .post(baseurl + "/" + data.formation_id + "/user/" + config.user.id_user + "/new/" + data.quiz_type, null, {
      headers: { Authorization: authHeader },
    })
    .then((response) => {
      return response.data;
    })
    .catch((e) => {
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
    .post(baseurl + "/" + data.formation_id + "/user/" + config.user.id_user + "/update/" + data.quiz_type, body, {
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
    .get(baseurl + "/user", {
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
    .get(baseurl + "/", {
      headers: { Authorization: authHeader }
    })
    .then((response) => {
      return response.data;
    })
};


export const registerFormation = async ({ id_formation, formation_name }) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  const body = {
    userId: config.user.id_user,
    formation: {
      id_formation: id_formation,
      formation_name: formation_name,
    }
  }

  return axios
    .post(baseurl + "/register", body, {
      headers: { Authorization: authHeader },
    })
    .then((response) => {
      return response.data;
    })
}

export const createFormationOrder = async ({ id_formation, users, billingAddress }) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;


  const body = {
    id_formation: id_formation,
    related_users_app_ids: users.map(user => { return user.id_user }),
    buyer: {
      id: billingAddress.id_buyer,
      type: billingAddress.type
    }
  }

  return axios
    .post(baseurl + "/pay", body, {
      headers: { Authorization: authHeader },
    })
    .then((response) => {
      return response.data;
    })
}
