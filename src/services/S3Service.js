import XMLParser from 'react-xml-parser';
import axios from "axios";


import { restoreLocalConfigAsync } from "../utils";

let API_URL = "https://api.orthomaster.fr/s3"


export const getS3Image = async (path) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.accessToken;

  return axios
    .get(API_URL + "/content", {
      headers: {
        'Access-Control-Allow-Origin': true,
        Authorization: authHeader
      },
      params: {
        key: path
      }
    })
    .then((response) => {
      return response.data.url;
    })
    .catch((e)=> {
      Sentry.Native.captureException(e);
    });
}

export const getS3XML = async (path) => {
  const fileUrl = await getS3Image(path)
  const response = await fetch(fileUrl)
  const text = await response.text()
  const fileContent = new XMLParser().parseFromString(text)

  return fileContent
}

