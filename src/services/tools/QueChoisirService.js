import axios from "axios";

import { restoreLocalConfigAsync } from "../../utils";
import { getS3XML } from '../S3Service'
import Constants from 'expo-constants';

let route = Constants.manifest.extra.env.API_URL + "/tools/queChoisir"

export const getAPIqueChoisirStep = async (id_question = 0) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.accessToken;

  let myParams = {}
  id_question > 0 ? myParams.id_question = id_question : myParams

  return axios
    .get(route + "/step", {
      headers: {
        Authorization: authHeader
      },
      params: myParams
    })
    .then((response) => {
      return response.data;
    })

}

