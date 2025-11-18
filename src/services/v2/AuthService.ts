import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants
const AUTH_TOKEN_KEY = 'JWT';
const USER_DATA_KEY = 'user';

// Base URL
const baseUrl = process.env.EXPO_PUBLIC_API_V2_URL + '/auth';

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

export interface LoginResponse {
    success: boolean;
    message?: string;
    token: string;
    user: User;
}

export interface MeResponse {
    success: boolean;
    user: User;
}

export interface LogoutResponse {
    success: boolean;
    message: string;
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
        const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
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
            await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_DATA_KEY]);
        }
        return Promise.reject(error);
    }
);

/**
 * Login with email & password
 */
export const login = async ({ email, password }: LoginParams) => {
    return axios
        .post(`${baseUrl}/login`, { email, password })
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
        .post(`${baseUrl}/login`, { email })
        .then((response) => {
            return response.data;
        })
        .catch((e: AxiosError) => {
            console.log(e);
            throw e;
        });

    throw new Error(result.message || 'Send email failed');
};

/**
 * Logout - Revoke token on server
 */
export const logout = async () => {
    return axios
        .post(`${baseUrl}/logout`)
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
    const result = await axios
        .get(`${baseUrl}/me`)
        .then((response) => {
            console.log(response.data);
            return response.data;
        })
        .catch((e: AxiosError) => {
            return null;
        });

    if (result && 'status' in result && result.status === 'success') {
        // Update user data
        await updateUserData(result.data.user);
        return result.data.user;
    }

    // Token invalid, clear data
    await clearAuthData();
    return null;
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
        return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
        console.error('Error getting token:', error);
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
        console.error('Error getting user data:', error);
        return null;
    }
};

/**
 * Store token and user data into AsyncStorage
 */
const saveAuthData = async (token: string, user: User): Promise<void> => {
    try {
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
    } catch (error) {
        console.error('Error saving auth data:', error);
        throw error;
    }
};

/**
 * Update user data on AsyncStorage
 */
const updateUserData = async (user: User): Promise<void> => {
    try {
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
    } catch (error) {
        console.error('Error updating user data:', error);
    }
};

/**
 * Clear all auth data
 */
const clearAuthData = async (): Promise<void> => {
    try {
        await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_DATA_KEY]);
    } catch (error) {
        console.error('Error clearing auth data:', error);
    }
};