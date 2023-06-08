import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";
import Constants from 'expo-constants';
import { osName } from 'expo-device';


let route = Constants.manifest.extra.env.API_URL + "/notification"



export const registerUserToNotification = async (pushToken) => {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.JWT;

    return axios
        .post(route + "/endpoint/create",
        null,
        {
            headers: { Authorization: authHeader },
            params: {
                push_token: pushToken,
                id_user: config.user.id_user,
                platform: osName
            }
        })
        .then((response) => {
            return response.data;
        })
        .catch((e) => {
            throw e
        });
}


