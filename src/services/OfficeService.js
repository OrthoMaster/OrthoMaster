import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";

let API_URL = "http://orthomasterapi-lb-1130920879.eu-west-1.elb.amazonaws.com/office"


export const getOfficeInfos = async (officeId) => {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.accessToken;
  
    return axios
      .get(API_URL+"/"+officeId, {
        headers: { Authorization: authHeader },
      })
      .then((response) => {
        return response.data;
      });
  }
