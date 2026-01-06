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
 * Get cart
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
            throw e;
        });
};