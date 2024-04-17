import axios from "axios";

import { restoreLocalConfigAsync } from "../../utils";

const baseurl = process.env.EXPO_PUBLIC_API_URL + "/tools/que-choisir"

export const getQueChoisir = async () => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .get(baseurl + "/get", {
      headers: {
        Authorization: authHeader
      }
    })
    .then((response) => {
      return response.data;
    })

}

export const saveQCEntries = async ({
  allFinalProductsSections,
  selectedProduct,
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
      final_products: finalProducts,
      id_office: config.user.office_id,
      selected_product: selectedProduct,
      history: userHistory,
      filters: filtersConfig.selected?.length > 0 ? filtersConfig.selected : null
    }, {
      headers: {
        Authorization: authHeader
      }
    })
    .then((response) => {
      return response.data;
    })

}