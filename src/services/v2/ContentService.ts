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
