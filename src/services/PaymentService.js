import axios from "axios";

import { restoreLocalConfigAsync } from "../futils";

const baseurl = process.env.EXPO_PUBLIC_API_URL+"/payment"


export const buyFormationLicence = async ({id_formation, selectedUsers}) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  let usersIdsArray = []

  selectedUsers.forEach(user => {
    usersIdsArray.push(user.id_user)
  });

  const body = {
    id_formation: id_formation,
    relatedUser: usersIdsArray,
    id_user: config.user.id_user
  }

  return axios
    .post(baseurl+"/formation", body, {
      headers: { Authorization: authHeader },
    })
    .then((response) => {
      return response.data;
    })
}
