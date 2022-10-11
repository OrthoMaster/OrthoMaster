import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";

let API_URL = "https://api.orthomaster.fr/logtime"


export const saveLogtimeOnLesson = async (log) => {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.accessToken;

    const body = {
        login: log.login,
        logout: log.logout,
        contentId: log.contentId
    }

    return axios
        .post(API_URL + "/lesson/user/" + config.user.id_user, body, {
            headers: { Authorization: authHeader },
        },
        
        )
        .then((response) => {
            return response.data;
        })
        .catch((e)=> {
            Sentry.Native.captureException(e);
          });
}

export const saveLogtimeOnApp = async (log) => {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.accessToken;

    const body = {
        login: log.login,
        logout: log.logout,
    }


    return axios
        .post(API_URL + "/user/" + config.user.id_user, body, {
            headers: { Authorization: authHeader },
        })
        .then((response) => {
            return response.data;
        })
        .catch((e)=> {
            Sentry.Native.captureException(e);
          });
}
