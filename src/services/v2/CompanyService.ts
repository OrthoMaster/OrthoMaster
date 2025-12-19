import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants
const AUTH_TOKEN_KEY = 'JWT';

// Base URL
const baseUrl = process.env.EXPO_PUBLIC_API_V2_URL;

// Configure axios interceptor to add token
axios.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor to handle 401 (Unauthorized)
axios.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        if (error.response?.status === 401) {
            // Token expired or invalid, clear local data
            await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
            await AsyncStorage.clear();
        }
        return Promise.reject(error);
    }
);

/**
 * Get user's company
 */
export const getCompany = async () => {
    return axios
        .get(`${baseUrl}/company`)
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

/**
 * Create Company
 */
export const createCompany = async (companyData: {
    name: string;
    establishment_id: string;
    email: string;
    phone?: string;
    address?: string;
    postal_code: string;
    city: string;
    country: string;
    tva?: string;
    siret?: string;
}) => {
    return axios
        .post(`${baseUrl}/company`, companyData)
        .then((response) => {
            return response.data;
        })
        .catch((e: AxiosError) => {
            return {
                success: false,
                message: (e.response?.data as any)?.message || 'Une erreur est survenue',
                statusCode: e.response?.status
            };
        });
};

/**
 * Update Company
 */
export const updateCompany = async (companyData: {
    id: string;
    name: string;
    establishment_id?: string;
    email: string;
    phone?: string;
    address?: string;
    postal_code: string;
    city: string;
    country: string;
    tva?: string;
    siret?: string;
}) => {
    return axios
        .put(`${baseUrl}/company/${companyData.id}`, companyData)
        .then((response) => {
            return response.data;
        })
        .catch((e: AxiosError) => {
            return {
                success: false,
                message: (e.response?.data as any)?.message || 'Une erreur est survenue',
                statusCode: e.response?.status
            };
        });
};

/**
 * Quit Company
 */
export const quitCompany = async () => {
    return axios
        .patch(`${baseUrl}/company/quit`)
        .then((response) => {
            return response.data;
        })
        .catch((e: AxiosError) => {
            return {
                success: false,
                message: (e.response?.data as any)?.message || 'Une erreur est survenue',
                statusCode: e.response?.status
            };
        });
};


/**
 * update manager of company
 */
export const updateManager = async (data: {
    user_id: string;
}) => {
    return axios
        .patch(`${baseUrl}/company/update-manager`, data)
        .then((response) => {
            return response.data;
        })
        .catch((e: AxiosError) => {
            return {
                success: false,
                message: (e.response?.data as any)?.message || 'Une erreur est survenue',
                statusCode: e.response?.status
            };
        });
};

/**
 * remove member
 */
export const removeMember = async (data: {
    user_id: string;
}) => {
    return axios
        .patch(`${baseUrl}/company/remove-member`, data)
        .then((response) => {
            return response.data;
        })
        .catch((e: AxiosError) => {
            return {
                success: false,
                message: (e.response?.data as any)?.message || 'Une erreur est survenue',
                statusCode: e.response?.status
            };
        });
};

/**
 * Invite member
 */
export const inviteMember = async (data: {
    email: string;
}) => {
    return axios
        .patch(`${baseUrl}/company/invite-member`, data)
        .then((response) => {
            return response.data;
        })
        .catch((e: AxiosError) => {
            return {
                success: false,
                message: (e.response?.data as any)?.message || 'Une erreur est survenue',
                statusCode: e.response?.status
            };
        });
};

/**
 * Prepare data before form
 */
export const getPreFormData = async () => {
    return axios
        .get(`${baseUrl}/company/pre-data`)
        .then((response) => {
            return response.data;
        })
        .catch((e: AxiosError) => {
            return {
                success: false,
                message: (e.response?.data as any)?.message || 'Une erreur est survenue',
                statusCode: e.response?.status
            };
        });
}