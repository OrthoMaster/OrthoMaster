import XMLParser from 'react-xml-parser';
import axios from "axios";


import { restoreLocalConfigAsync } from "../futils";
const baseurl = process.env.EXPO_PUBLIC_API_URL+"/s3"


export const getS3Image = async (path) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .get(baseurl + "/content", {
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
}

export const getS3XML = async (path) => {
  const fileUrl = await getS3Image(path)
  const response = await fetch(fileUrl)
  const text = await response.text()
  const fileContent = new XMLParser().parseFromString(text)

  return fileContent
}

