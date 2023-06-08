import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";
import Constants from 'expo-constants';
let route = Constants.manifest.extra.env.API_URL+"/logtime"


export const saveLogtimeOnLesson = async (log) => {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.JWT;

    const body = {
        login: log.login,
        logout: log.logout,
        contentId: log.contentId
    }

    return axios
        .post(route + "/lesson/user/" + config.user.id_user, body, {
            headers: { Authorization: authHeader },
        },
        
        )
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
        .post(route + "/user/" + config.user.id_user, body, {
            headers: { Authorization: authHeader },
        })
        .then((response) => {
            return response.data;
        })
        .catch((e)=> {
            throw e
          });
}
