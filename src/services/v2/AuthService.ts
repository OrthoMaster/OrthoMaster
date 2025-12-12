import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants
const AUTH_TOKEN_KEY = 'JWT';
const USER_DATA_KEY = 'user';

// Base URL
const baseUrl = process.env.EXPO_PUBLIC_API_V2_URL;
const authUrl = process.env.EXPO_PUBLIC_API_V2_URL + '/auth';

// Types
export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string | null;
    created_at: string;
    updated_at: string;
    avatar?: string;
    phone?: string;
    id_user: number;
}

interface LoginParams {
    email: string;
    password: string;
}

interface ForgotParam {
    email: string
}

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
 * Login with email & password
 */
export const login = async ({ email, password }: LoginParams) => {
    return axios
        .post(`${authUrl}/login`, { email, password })
        .then((response) => {
            return response.data;
        })
        .catch((e: AxiosError) => {
            throw e;
        });
};

/**
 * Login with email & password
 */
export const forgot = async ({ email }: ForgotParam) => {
    const result = await axios
        .post(`${authUrl}/login`, { email })
        .then((response) => {
            return response.data;
        })
        .catch((e: AxiosError) => {
            throw e;
        });

    throw new Error(result.message || 'Send email failed');
};

/**
 * Logout - Revoke token on server
 */
export const logout = async () => {
    return axios
        .post(`${authUrl}/logout`)
        .then((response) => {
            return response.data;
        })
        .catch((e: AxiosError) => {
            throw e;
        })
        .finally(async () => {
            // Clear local data
            await clearAuthData();
        });
};

/**
 * Get current user
 * Return null if token invalid
 */
export const me = async () => {
    return axios
        .get(`${authUrl}/me`)
        .then((response) => {
            return response.data.data.user;
        })
        .catch((e: AxiosError) => {
            throw e;
        });
};

/**
 * Get full info of user
 */
export const getMoreInfo = async () => {
    return axios
        .get(`${authUrl}/more`)
        .then((response) => {
            return response.data;
        })
        .catch((e: AxiosError) => {
            return {
                success: false,
                message: e.response?.data?.message || 'Une erreur est survenue',
                statusCode: e.response?.status
            };
        });
};

/**
 * Check user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
    const token = await getToken();
    if (!token) return false;

    // Verify token
    const user = await me();
    return user !== null;
};

/**
 * Get token from AsyncStorage
 */
export const getToken = async (): Promise<string | null> => {
    try {
        return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    } catch (error) {
        return null;
    }
};

/**
 * Get user data from AsyncStorage
 */
export const getUserData = async (): Promise<User | null> => {
    try {
        const userData = await AsyncStorage.getItem(USER_DATA_KEY);
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        return null;
    }
};


/**
 * Clear all auth data
 */
const clearAuthData = async (): Promise<void> => {
    try {
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
        await AsyncStorage.clear();
    } catch (error) {
        return;
    }
};

/**
 * Get last notification
 */
export const getLastestNotification = async () => {
    return axios
        .get(`${baseUrl}/notifications/lastest`)
        .then((response) => {
            return response.data;
        })
        .catch((e: AxiosError) => {
            return {
                success: false,
                message: e.response?.data?.message || 'Une erreur est survenue',
                statusCode: e.response?.status
            };
        });
}

/**
 * Get notifications
 */
export const getNotifications = async () => {
    return axios
        .get(`${baseUrl}/notifications`)
        .then((response) => {
            return response.data;
        })
        .catch((e: AxiosError) => {
            return {
                success: false,
                message: e.response?.data?.message || 'Une erreur est survenue',
                statusCode: e.response?.status
            };
        });
}

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async () => {
    return axios
        .post(`${baseUrl}/notifications/read`)
        .then((response) => {
            return response.data;
        })
        .catch((e: AxiosError) => {
            return {
                success: false,
                message: e.response?.data?.message || 'Une erreur est survenue',
                statusCode: e.response?.status
            };
        });
}

/**
 * Mark all notifications as read
 */
export const deleteAllNotification = async () => {
    return axios
        .delete(`${baseUrl}/notifications`)
        .then((response) => {
            return response.data;
        })
        .catch((e: AxiosError) => {
            return {
                success: false,
                message: e.response?.data?.message || 'Une erreur est survenue',
                statusCode: e.response?.status
            };
        });
}

/**
 * Mark notification as read
 */
export const markAsRead = async (notiId: string) => {
    return axios
        .put(`${baseUrl}/notifications/${notiId}/read`)
        .then((response) => {
            return response.data;
        })
        .catch((e: AxiosError) => {
            return {
                success: false,
                message: e.response?.data?.message || 'Une erreur est survenue',
                statusCode: e.response?.status
            };
        });
}

/**
 * Delete a notification
 */
export const deleteNotification = async (notiId: string) => {
    return axios
        .delete(`${baseUrl}/notifications/${notiId}`)
        .then((response) => {
            return response.data;
        })
        .catch((e: AxiosError) => {
            return {
                success: false,
                message: e.response?.data?.message || 'Une erreur est survenue',
                statusCode: e.response?.status
            };
        });
}

/**
 * Accept a confirm notification
 */
export const acceptNotification = async (notiId: string) => {
    return axios
        .put(`${baseUrl}/notifications/${notiId}/accept`)
        .then((response) => {
            return response.data;
        })
        .catch((e: AxiosError) => {
            return {
                success: false,
                message: e.response?.data?.message || 'Une erreur est survenue',
                statusCode: e.response?.status
            };
        });
}

/**
 * Reject a confirm notification
 */
export const rejectNotification = async (notiId: string) => {
    return axios
        .put(`${baseUrl}/notifications/${notiId}/reject`)
        .then((response) => {
            return response.data;
        })
        .catch((e: AxiosError) => {
            return {
                success: false,
                message: e.response?.data?.message || 'Une erreur est survenue',
                statusCode: e.response?.status
            };
        });
}

/**
 * Prepare data before form
 */
export const getPreFormData = async () => {
    return axios
        .get(`${baseUrl}/profile/pre-data`)
        .then((response) => {
            return response.data;
        })
        .catch((e: AxiosError) => {
            return {
                success: false,
                message: e.response?.data?.message || 'Une erreur est survenue',
                statusCode: e.response?.status
            };
        });
}

/**
 * Update profile
 * @param data 
 */
export const updateProfile = async (data: {
    name: string;
    first_name: string;
    first_name_birth: string;
    date_of_birth: string;
    phone: string;
    postal_code: string;
    city: string;
    country: string;
    profession_id: string;
    funding_organization_id: string;
    no_secu: string;
}) => {
    return axios
        .put(`${baseUrl}/profile`, data)
        .then((response) => {
            return response.data;
        })
        .catch((e: AxiosError) => {
            return {
                success: false,
                message: e.response?.data?.message || 'Une erreur est survenue',
                statusCode: e.response?.status
            };
        });
}

export const changePassword = async (data : {
    new_password: string
    new_password_confirmation: string
}) => {
    return axios
        .post(`${baseUrl}/profile/password`, data)
        .then((response) => {
            return response.data;
        })
        .catch((e: AxiosError) => {
            return {
                success: false,
                message: e.response?.data?.message || 'Une erreur est survenue',
                statusCode: e.response?.status
            };
        });
}

export const sendEmailVerification = (data : { email: string }) => {
    return
}
export const verifyEmailCode = () => {
    return;
}