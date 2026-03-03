// axiosInstance.web.ts
import axios from 'axios';

const AUTH_TOKEN_KEY = 'JWT';
const baseUrl = process.env.EXPO_PUBLIC_API_V2_URL;

// Web Event emitter (with 'off' method)
class WebEventEmitter {
  private listeners: { [key: string]: Function[] } = {};

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: Function) {
    if (!this.listeners[event]) return;
    
    this.listeners[event] = this.listeners[event].filter(
      listener => listener !== callback
    );
  }

  emit(event: string, ...args: any[]) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(...args));
    }
  }

  removeAllListeners(event?: string) {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }
}

export const authEvents = new WebEventEmitter();

const axiosInstance = axios.create({
    baseURL: baseUrl,
    timeout: 20000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

axiosInstance.interceptors.request.use(
    async (config) => {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
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
        if (!error.response) {
            console.error('Network Error:', error);
            return Promise.reject(error);
        }

        if (error.response?.status === 401) {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.clear();
            authEvents.emit('unauthorized');
        }
        
        return Promise.reject(error);
    }
);

export default axiosInstance;
export { baseUrl };