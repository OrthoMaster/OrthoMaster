// axiosInstance.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EventEmitter } from 'events';

// Constants
const AUTH_TOKEN_KEY = 'JWT';

const baseUrl = process.env.EXPO_PUBLIC_API_V2_URL;

// Event emitter
export const authEvents = new EventEmitter();

// Axios instance
const axiosInstance = axios.create({
    baseURL: baseUrl,
    timeout: 20000
});

// Request interceptor
axiosInstance.interceptors.request.use(
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

// Response interceptor
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Clear local data
            await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
            await AsyncStorage.clear();
            
            // Emit event
            authEvents.emit('unauthorized');
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
export { baseUrl };