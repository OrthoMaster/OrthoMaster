import { AxiosError } from 'axios';
import axiosInstance, { baseUrl } from './axiosInstance';

/**
 * Daily question
 */
export const getDailyQuestion = async () => {
    return axiosInstance
        .get(`${baseUrl}/daily-question`)
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

