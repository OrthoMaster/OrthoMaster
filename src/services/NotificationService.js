import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";
import { osName } from 'expo-device';


const baseurl = process.env.EXPO_PUBLIC_API_URL + "/notification"



export const saveUserExpoPushToken = async (pushToken) => {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.JWT;

    return axios
        .post(baseurl + "/endpoint/create",
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


