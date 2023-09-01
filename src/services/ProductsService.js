import axios from "axios";

import Constants from 'expo-constants';
import { restoreLocalConfigAsync } from "../utils";

let route = Constants.manifest.extra.env.API_URL + "/products"

export const getAPIgetProducts = async (category) => {
    const config = await restoreLocalConfigAsync()

    const authHeader = 'Bearer ' + config.JWT;
    return axios
        .get(route + "/products", {
            headers: {
                Authorization: authHeader
            },
            params: {
                category: category
            }
        })
        .then((response) => {
            return response.data;
        })

}

export const getProductsBrands = async () => {
    const config = await restoreLocalConfigAsync()

    const authHeader = 'Bearer ' + config.JWT;
    return axios
        .get(route + "/brands", {
            headers: {
                Authorization: authHeader
            }
        })
        .then((response) => {
            return response.data;
        })

}