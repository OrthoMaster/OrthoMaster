import { AxiosError } from 'axios';
import axiosInstance, { baseUrl } from './axiosInstance';

/**
 * Ajoute ou retire un centre d'intérêt du suivi de l'utilisateur.
 * POST /favourites/topics/toggle
 * @param topicId 
 * @returns 
 */
export const toggleTopic = async (topicId: string | number) => {
  return axiosInstance
    .post(`${baseUrl}/favourites/topics/toggle`, { topicId })
    .then((response) => {
      if (response.data?.success == true) {
        return true;
      }
      return false;
    })
    .catch((e: AxiosError) => {
      return false;
    });
}

/**
 * Ajoute ou retire un contenu des favoris de l'utilisateur.
 * POST /favourites/toggle
 * @param id 
 * @param type 'podcast', 'video', 'infographic'
 * @returns 
 */
export const toggleFavourite = async (
  id: string | number,
  type: 'podcast' | 'video' | 'infographic'
) => {
  return axiosInstance
    .post(`${baseUrl}/favourites/toggle`, { id, type })
    .then((response) => {
      if (response.data?.success == true) {
        return true;
      }
      return false;
    })
    .catch((e: AxiosError) => {
      return false;
    });
}

/**
 * Liste des favoris.
 *
 * Sans `type` : un échantillon de chaque catégorie, `data` est un objet
 * { podcast: [], video: [], infographic: [] }.
 * Avec `type` : la catégorie demandée, `data` est un tableau et la réponse
 * contient en plus `pagination`.
 *
 * GET /favourites
 */
export const getFavourites = async (params?: {
  type?: 'podcast' | 'video' | 'infographic';
  page?: number;
  limit?: number;
  sort?: 'date' | 'name';
  order?: 'asc' | 'desc';
  podcastLimit?: number;
  videoLimit?: number;
  infographicLimit?: number;
}) => {
  return axiosInstance
    .get(`${baseUrl}/favourites`, { params })
    .then((response) => {
      if (response.data?.success == true) {
        return response.data;
      }

      return null;
    })
    .catch((e: AxiosError) => {
      return null;
    });
}