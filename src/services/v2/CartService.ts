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

export interface PaymentIntentResponse {
    success: boolean;
    client_secret: string;
    payment_intent_id: string;
    publishable_key: string;
}

export interface PaymentConfirmResponse {
    success: boolean;
    message: string;
    invoice?: any;
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
export const getCartDetails = async () => {
    return axios
        .get(`${baseUrl}/cart`)
        .then((response) => {
            if (response.data?.success == true) {
                return response.data.data[0];
            }

            return null;
        })
        .catch((e: AxiosError) => {
            throw e;
        });
};

export const addToCart = async (itemId: any) => {
    return axios
        .put(`${baseUrl}/cart/add/${itemId}`)
        .then((response) => {
            if (response.data?.success == true) {
                return true;
            }

            return false;
        })
        .catch((e: AxiosError) => {
            return false;
        });
};

export const removeFromCart = async (itemId: any) => {
    return axios
        .delete(`${baseUrl}/cart/remove/${itemId}`)
        .then((response) => {
            if (response.data?.success == true) {
                return true;
            }

            return false;
        })
        .catch((e: AxiosError) => {
            return false;
        });
};

export const clearCart = async () => {
    return axios
        .delete(`${baseUrl}/cart/clear`)
        .then((response) => {
            if (response.data?.success == true) {
                return true;
            }

            return false;
        })
        .catch((e: AxiosError) => {
            return false;
        });
};

export const syncMembers = async (memberIds: string[]) => {
    return axios
        .put(`${baseUrl}/cart/members`, { members: memberIds })
        .then((response) => {
            if (response.data?.success == true) {
                return true;
            }

            return false;
        })
        .catch((e: AxiosError) => {
            return false;
        });
};

export const createPaymentIntent = async (invoiceId: number): Promise<PaymentIntentResponse | null> => {
    try {
        const response = await axios.post(`${baseUrl}/payments/invoices/${invoiceId}/create-intent`);
        
        if (response.data?.success === true) {
            return {
                success: true,
                client_secret: response.data.client_secret,
                payment_intent_id: response.data.payment_intent_id,
                publishable_key: response.data.publishable_key,
            };
        }
        
        return null;
    } catch (e: any) {
        console.error('Create Payment Intent Error:', e.response?.data || e.message);
        throw e;
    }
};

export const confirmPayment = async (
    invoiceId: number,
    paymentIntentId: string
): Promise<PaymentConfirmResponse> => {
    try {
        const response = await axios.post(`${baseUrl}/payments/invoices/${invoiceId}/confirm`, {
            payment_intent_id: paymentIntentId,
        });
        
        if (response.data?.success === true) {
            return {
                success: true,
                message: response.data.message || 'Payment successful',
                invoice: response.data.invoice,
            };
        }
        
        return {
            success: false,
            message: response.data?.message || 'Payment confirmation failed',
        };
    } catch (e: any) {
        console.error('Confirm Payment Error:', e.response?.data || e.message);
        return {
            success: false,
            message: e.response?.data?.message || 'Payment confirmation failed',
        };
    }
};

export const cancelPayment = async (invoiceId: number): Promise<boolean> => {
    try {
        const response = await axios.post(`${baseUrl}/payments/invoices/${invoiceId}/cancel`);
        
        return response.data?.success === true;
    } catch (e: any) {
        console.error('Cancel Payment Error:', e.response?.data || e.message);
        return false;
    }
};

export const getInvoiceStatus = async (invoiceId: number) => {
    try {
        const response = await axios.get(`${baseUrl}/invoices/${invoiceId}`);
        
        if (response.data?.success === true) {
            return response.data.data;
        }
        
        return null;
    } catch (e: any) {
        console.error('Get Invoice Status Error:', e.response?.data || e.message);
        throw e;
    }
};