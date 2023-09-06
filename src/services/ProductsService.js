import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";

const baseurl = process.env.EXPO_PUBLIC_API_URL + "/products"

export const getAPIgetProducts = async (category) => {
    const config = await restoreLocalConfigAsync()

    const authHeader = 'Bearer ' + config.JWT;
    return axios
        .get(baseurl + "/products", {
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
        .get(baseurl + "/brands", {
            headers: {
                Authorization: authHeader
            }
        })
        .then((response) => {
            return response.data;
        })

}