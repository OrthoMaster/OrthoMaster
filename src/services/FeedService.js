import axios from "axios";

import { restoreLocalConfigAsync } from "../utils";

const baseurl = process.env.EXPO_PUBLIC_API_URL+ "/feed"

export const fetchFeedsFromCategory = async (id_category) => {
  const config = await restoreLocalConfigAsync()
  const authHeader = 'Bearer ' + config.JWT;

  return axios
    .get(baseurl + "/", {
      headers: {
        Authorization: authHeader
      },
      params:{
        id_feed_category: id_category,
        id_user: config.user.id_user
      }
    })
    .then((response) => {
      return response.data;
    })

}

export const fetchFeedCategories = async () => {
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

  export const likeArticle = async (id_article) => {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.JWT;
  
    return axios
      .post(baseurl + "/article/like", {
        id_user: config.user.id_user,
        id_article: id_article
      }, {
        headers: {
          Authorization: authHeader
        }
      })
      .then((response) => {
        return response.data;
      })
  }

  export const dislikeArticle = async (id_article) => {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.JWT;
  
    return axios
      .post(baseurl + "/article/dislike", {
        id_user: config.user.id_user,
        id_article: id_article
      }, {
        headers: {
          Authorization: authHeader
        }
      })
      .then((response) => {
        return response.data;
      })
  }

