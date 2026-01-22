import { AxiosError } from 'axios';
import axiosInstance, { baseUrl } from './axiosInstance';

/**
 * Daily action : Quiz and Podcast
 */
export const getDailyAction = async () => {
    return axiosInstance
        .get(`${baseUrl}/daily-action`)
        .then((response) => {
            if (response.data?.success == true) {
                return response.data?.data;
            }

            return false;
        })
        .catch((e: AxiosError) => {
            return false;
        });
}

/**
 * Store user's answer 
 */
export const answerDailyQuestion = async (questionId: string, answerId: string) => {
    return axiosInstance
        .put(`${baseUrl}/daily-question`, { questionId, answerId })
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
 * Count times the podcast is played
 */
export const countTimesPodcast = async (podcastId: string) => {
    return axiosInstance
        .put(`${baseUrl}/daily-podcast/count`, { podcastId })
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
 * Get search histories and trending keywords
 */
export const getPreSearch = async () => {
    return axiosInstance
        .get(`${baseUrl}/content/pre-search`)
        .then((response) => {
            if (response.data?.success == true) {
                return response.data?.data;
            }

            return null;
        })
        .catch((e: AxiosError) => {
            return null;
        });
}

/**
 * Search content
 */
export const search = async (
    keyword: string,
    category: string,
    lessonsPage: number = 1,
    videosPage: number = 1
) => {
    return axiosInstance
        .post(`${baseUrl}/content/search`, {
            keyword: keyword,
            category: category,
            lessons_page: lessonsPage,
            videos_page: videosPage
        })
        .then((response) => {
            if (response.data?.success == true) {
                return response.data?.data;
            }

            return false;
        })
        .catch((e: AxiosError) => {
            return false;
        });
}

/**
 * Delete 1 keyword from search history
 */
export const deleteKeyword = async (id: string) => {
    return axiosInstance
        .delete(`${baseUrl}/content/search/history/${id}`)
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
 * Clear all search history
 */
export const clearSearchHistory = async () => {
    return axiosInstance
        .delete(`${baseUrl}/content/search/histories`)
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
 * Get S3 Url
 */
export const getS3Url = async (content: string) => {
    return axiosInstance
        .post(`${baseUrl}/content/s3-url`, { content })
        .then((response) => {
            if (response.data?.success == true) {
                return response.data?.url;
            }

            return null;
        })
        .catch((e: AxiosError) => {
            return null;
        });
}