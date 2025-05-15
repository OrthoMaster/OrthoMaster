import axios from "axios";

import { restoreLocalConfigAsync } from "../futils";
const baseurl = process.env.EXPO_PUBLIC_API_URL



export const getOfficeInfos = async (officeId) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;
  return axios
    .get(baseurl + "/office/" + officeId, {
      headers: { Authorization: authHeader },
    })
    .then((response) => {
      return response.data;
    })
    .catch((e) => {
      throw e
    });
}

export const getOfficeByManager = async () => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .get(baseurl + "/office/manager/" + config.user.id_user, {
      headers: { Authorization: authHeader }
    })
    .then((response) => {
      return response.data;
    })
    .catch((e) => {
      throw e
    });
}

export const getOfficeInvitationToken = async (officeId) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .get(baseurl + "/office/invitation-token/" + officeId, {
      headers: { Authorization: authHeader }
    })
    .then((response) => {
      return response.data;
    })
    .catch((e) => {
      throw e
    });
}

export const removeUserFromAccount = async (userId) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .post(baseurl + "/office/remove-user/" + userId, {}, {
      headers: { Authorization: authHeader }
    })
    .then((response) => {
      return response;
    })
    .catch((e) => {
      throw e
    });
}

export const sendActivationLink = async (username) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;


  return axios
    .post(baseurl + "/user/activation-link/", {
      username: username
    }, {
      headers: { Authorization: authHeader }
    })
    .then((response) => {
      return response.data;
    })
    .catch((e) => {
      throw e
    });
}

export const getCountries = async () => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .get(baseurl + "/office/countries/list", {
      headers: { Authorization: authHeader }
    })
    .then((response) => {
      return response.data;
    })
    .catch((e) => {
      throw e
    });
}

export const getStructures = async () => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .get(baseurl + "/office/structures/list", {
      headers: { Authorization: authHeader }
    })
    .then((response) => {
      return response.data;
    })
    .catch((e) => {
      throw e
    });
}


export const createOffice = async (office) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .post(baseurl + "/office/v2/create", office, {
      headers: { Authorization: authHeader },
      params: {
        creator_id: config.user.id_user
      }
    })
    .then((response) => {
      return response;
    })
    .catch((e) => {
      throw e
    });
}


export const addMemberOffice = async ({ email, id_office }) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .post(baseurl + "/office/v2/add-member", {
      email: email,
      id_office: id_office
    }, {
      headers: { Authorization: authHeader }
    })
    .then((response) => {
      return response;
    })
    .catch((e) => {
      throw e
    });
}

export const removeMemberOffice = async ({ id_user, id_office }) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .post(baseurl + "/office/v2/remove-member", {
      id_user: id_user,
      id_office: id_office
    }, {
      headers: { Authorization: authHeader }
    })
    .then((response) => {
      return response;
    })
    .catch((e) => {
      throw e
    });
}


export const getUserAttachedOffices = async ({ userId = 0 }) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;
  
  return axios
    .get(baseurl + "/office/v2/list", {
      headers: { Authorization: authHeader },
      params: {
        members: [userId > 0 ? userId : config.user.id_user]
      }

    })
    .then((response) => {
      return response.data;
    })

}
