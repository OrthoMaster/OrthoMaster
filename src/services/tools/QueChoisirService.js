import axios from "axios";

import { restoreLocalConfigAsync } from "../../futils";
import { getSessionId } from "../SessionEventService";

const baseurl = process.env.EXPO_PUBLIC_API_URL + "/tools/que-choisir"

export const getAPIqueChoisirStep = async (category) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .get(baseurl + "/step", {
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

export const getAPIqueChoisirRedFlags = async (category) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .get(baseurl + "/redflags", {
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

export const getQCcategories = async () => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .get(baseurl + "/categories", {
      headers: {
        Authorization: authHeader
      }
    })
    .then((response) => {
      return response.data;
    })

}

export const saveQCEntries = async ({
  category,
  allFinalProductsSections,
  userHistory,
  filtersConfig
}) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  let finalProducts = []
  allFinalProductsSections.forEach(section => {
    finalProducts.push(...section.products)
  });

  return axios
    .post(baseurl + "/save", {
      category: category,
      final_products: finalProducts,
      history: userHistory,
      filters: filtersConfig.selected?.length > 0 ? filtersConfig.selected : null,
      session_id: getSessionId()
    }, {
      headers: {
        Authorization: authHeader
      }
    })
    .then((response) => {
      return response.data;
    })

}