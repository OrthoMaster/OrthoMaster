import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";

let API_URL = "http://orthomasterapi-lb-1130920879.eu-west-1.elb.amazonaws.com/logtime"


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
        });
}
