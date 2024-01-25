import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";
const baseurl = process.env.EXPO_PUBLIC_API_URL+"/v2/subscription"


export const getCustomerPortal = async (idOffice) => {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.JWT;

    return axios
        .get(baseurl + "/customer-portal", {
            headers: { Authorization: authHeader },
            params: {
                officeId: idOffice
            }
        })
        .then((response) => {
            return response.data;
        })
        .catch((e)=> {
          throw e
        });
}