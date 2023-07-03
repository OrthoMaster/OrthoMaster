import axios from "axios";

import Constants from 'expo-constants';
import { restoreLocalConfigAsync } from "../utils";

let route = Constants.manifest.extra.env.API_URL + "/products"

export const getAPIgetProducts = async (type) => {
    const config = await restoreLocalConfigAsync()

    const authHeader = 'Bearer ' + config.JWT;
    return axios
        .get(route + "/products", {
            headers: {
                Authorization: authHeader
            },
            params: {
                type: type
            }
        })
        .then((response) => {
            return response.data;
        })

}