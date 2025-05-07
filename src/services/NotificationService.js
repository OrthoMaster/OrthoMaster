import axios from "axios";

import { restoreLocalConfigAsync } from "../futils";
import { osName } from 'expo-device';
import * as SecureStore from 'expo-secure-store';


const baseurl = process.env.EXPO_PUBLIC_API_URL + "/notification"



export const saveUserExpoPushToken = async (pushToken) => {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.JWT;

    return axios
        .post(baseurl + "/register",
            {
                push_token: pushToken,
                id_user: config.user.id_user,
                platform: osName,
                type: "expo"
            },
            {
                headers: { Authorization: authHeader }
            })
        .then((response) => {
            return response.data;
        })
        .catch((e) => {
            return
        });
}

export const deleteUserExpoPushToken = async () => {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.JWT;
    const expoPushToken = await SecureStore.getItemAsync("expoPushToken")

    if (config.JWT == null || config.user == null) {
        return
    }
    return axios
        .delete(baseurl + "/unregister",
            {
                data: {
                    push_token: expoPushToken,
                    id_user: config.user.id_user
                },
                headers: { Authorization: authHeader }
            })
        .then((response) => {
            return response.data;
        })
        .catch((e) => {
            throw e
        });
}
