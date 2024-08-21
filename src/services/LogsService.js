import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";
const baseurl = process.env.EXPO_PUBLIC_API_URL+"/logtime"


export const saveLogtimeOnLesson = async (log) => {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.JWT;

    const body = {
        login: log.login,
        logout: log.logout,
        content_id: log.contentId,
        id_user_registered_formation: log.idUserRegisteredFormation
    }

    return axios
        .post(baseurl + "/lesson/user/" + config.user.id_user, body, {
            headers: { Authorization: authHeader },
        })
        .then((response) => {
            return response.data;
        })
        .catch((e)=> {
            throw e
          });
}

export const saveLogtimeOnApp = async (log) => {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.JWT;

    const body = {
        login: log.login,
        logout: log.logout,
    }


    return axios
        .post(baseurl + "/user/" + config.user.id_user, body, {
            headers: { Authorization: authHeader },
        })
        .then((response) => {
            return response.data;
        })
        .catch((e)=> {
            throw e
          });
}
