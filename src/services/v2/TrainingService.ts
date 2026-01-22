import { AxiosError } from 'axios';
import axiosInstance, { baseUrl } from './axiosInstance';

// Types
export interface CartItem {
    id: number;
    name: string;
}

export interface Cart {
    items: CartItem[];
    total: number;
}

/**
 * Get trainings
 */
export const getTrainings = async () => {
    return axiosInstance
        .get(`${baseUrl}/trainings`)
        .then((response) => {
            if (response.data?.success == true) {
                return response.data.data;
            }

            return null;
        })
        .catch((e: AxiosError) => {
            return null;
        });
};

/**
 * Get trainings
 */
export const getPackage = async (packageId: string) => {
    return axiosInstance
        .get(`${baseUrl}/trainings/packages/${packageId}`)
        .then((response) => {
            if (response.data?.success == true) {
                return response.data.data;
            }

            return null;
        })
        .catch((e: AxiosError) => {
            return null;
        });
};

/**
 * Get content of lesson
 */
export const getLessonContent = async (lessonId: string) => {
    return axiosInstance
        .post(`${baseUrl}/trainings/lesson/content`, { lessonId })
        .then((response) => {
            if (response.data?.success == true) {
                return response.data.data;
            }

            return null;
        })
        .catch((e: AxiosError) => {
            return null;
        });
}

/**
 * Update progress of lesson
 */
export const completeLesson = async (lessonId: string) => {
    return axiosInstance
        .put(`${baseUrl}/trainings/lesson/complete`, { lessonId })
        .then((response) => {
            if (response.data?.success == true) {
                return true;
            }

            return null;
        })
        .catch((e: AxiosError) => {
            return null;
        });
}
