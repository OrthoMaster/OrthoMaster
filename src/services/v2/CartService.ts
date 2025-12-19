import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants
const AUTH_TOKEN_KEY = 'JWT';

// Base URL
const baseUrl = process.env.EXPO_PUBLIC_API_V2_URL;

// Types
export interface CartItem {
    id: number;
    name: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
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
 * Get cart
 */
export const getCartItems = async () => {
    return axios
        .get(`${baseUrl}/cart`)
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

export const removeFromCart = () => { return null; };
export const clearCart = () => { return null; };
export const updateCartItemQuantity = () => { return null; };