import axios from "axios";

import { restoreLocalConfigAsync } from "../../utils";
import Constants from 'expo-constants';

let route = Constants.manifest.extra.env.API_URL + "/v2/support"

export const sendSupportTicket = async ({subject = "", priority = "", content = "", category = "", companyId = null, txId = null}) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .post(route,
      {
        subject: subject,
        priority: priority,
        content: content,
        category: category,
        companyId: companyId,
        txId: txId
      }, {
      headers: {
        Authorization: authHeader
      }
    })
    .then((response) => {
      return response;
    })

}


