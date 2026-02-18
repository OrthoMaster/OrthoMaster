import axios from 'axios';
import { secureStorage, storage } from '../../storage';
import { EventEmitter } from 'events';

const AUTH_TOKEN_KEY = 'JWT';
const baseUrl = process.env.EXPO_PUBLIC_API_V2_URL;

export const authEvents = new EventEmitter();

const axiosInstance = axios.create({
    baseURL: baseUrl,
    timeout: 20000
});

axiosInstance.interceptors.request.use(
    async (config) => {
        const token = await secureStorage.getItem(AUTH_TOKEN_KEY);
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await secureStorage.deleteItem(AUTH_TOKEN_KEY);
            await storage.clear();
            authEvents.emit('unauthorized');
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
export { baseUrl };