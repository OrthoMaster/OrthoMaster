import { AxiosError } from 'axios';
import axiosInstance, { baseUrl } from './axiosInstance';

export const getSelectedProductBrands = async () => {
    return axiosInstance
        .get(`${baseUrl}/tools/user/brands`)
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

export const updateSelectedProductBrands = async (brands) => {
    return axiosInstance
        .post(`${baseUrl}/tools/user/brands`, { brands })
        .then(() => {
            return null;
        })
        .catch((e: AxiosError) => {
            return null;
        });
};