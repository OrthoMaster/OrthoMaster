import axios from "axios";

import { Buffer } from "buffer"
import { restoreLocalConfigAsync } from "../futils";

const baseurl = process.env.EXPO_PUBLIC_API_URL + "/user"

export const getUsersByOfficeId = async (officeId) => {

    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.JWT;

    return axios
        .get(baseurl + "/v2/office", {
            headers: { Authorization: authHeader },
            params: {
                id: officeId
            }
        })
        .then((response) => {
            return response.data;
        })
        .catch((e) => {
            throw e
        });
}


export const getCurrentUser = async () => {
    try {
        const config = await restoreLocalConfigAsync()
        const authHeader = 'Bearer ' + config.JWT;
        const parts = config.JWT.split('.').map((part) => Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
        const userId = JSON.parse(parts[1])?.id_user;

        return axios
            .get(baseurl + "/", {
                headers: { Authorization: authHeader },
                params: {
                    id_user: userId
                }
            })
            .then((response) => {
                return response.data;
            })

        // return axios
        //     .get("http://127.0.0.1:8000/api/test",{
        //         params: {
        //             id_user: userId
        //         }
        //     })
        //     .then((response) => {
        //         return response.data;
        //     })
    } catch (error) {
        return null
    }
}

export const getBillingAddress = async () => {
    try {
        const config = await restoreLocalConfigAsync()
        const authHeader = 'Bearer ' + config.JWT;

        return axios
            .get(baseurl + "/billing-address/list", {
                headers: { Authorization: authHeader },
                params: {
                    id_user: config.user.id_user
                }
            })
            .then((response) => {
                return response.data;
            })

    } catch (error) {
        return null
    }
}

export const setPersonnalBillingAddress = async ({
    street, zip, city, country
}) => {
    try {
        const config = await restoreLocalConfigAsync()
        const authHeader = 'Bearer ' + config.JWT;

        return axios
            .post(baseurl + "/billing-address/create", {
                street,
                zip,
                city,
                country
            }, {
                headers: { Authorization: authHeader },
                params: {
                    user: config.user.id_user
                }
            })
            .then((response) => {
                return response.data;
            })

    } catch (error) {
        return null
    }
}

export const getJobsFunction = async () => {
    try {
        const config = await restoreLocalConfigAsync()
        const authHeader = 'Bearer ' + config.JWT;

        return axios
            .get(baseurl + "/jobs/list", {
                headers: { Authorization: authHeader }
            })
            .then((response) => {
                return response.data;
            })

    } catch (error) {
        return null
    }
}