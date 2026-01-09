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

export interface PaymentIntentResponse {
    success: boolean;
    invoice_id: string;
    client_secret: string;
    payment_intent_id: string;
    publishable_key: string;
}

export interface PaymentConfirmResponse {
    success: boolean;
    message: string;
    invoice?: any;
}

/**
 * Get cart
 */
export const getCartDetails = async () => {
    return axiosInstance
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

export const addToCart = async (itemId: any) => {
    return axiosInstance
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
    return axiosInstance
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
    return axiosInstance
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

/**
 * Payment
 */
export const createPaymentIntent = async (
    id: string,
    amount: number,
    promotionCode: string,
    discountAmount: number,
    tvaAmount: number,
    companyName: string,
    companyAddress: string,
) => {
    return axiosInstance.post(`${baseUrl}/payments/invoices/create-intent`,
        {
            id: id,
            amount: amount,
            promotionCode: promotionCode,
            discountAmount: discountAmount,
            tvaAmount: tvaAmount,
            companyName,
            companyAddress
        }, {
        validateStatus: (status) => {
            // status code 200-499 is success
            return status >= 200 && status < 500;
        }
    }).then((response) => {
        if (response.data?.success === true) {
            return {
                success: true,
                invoice_id: response.data.invoice_id,
                client_secret: response.data.client_secret,
                payment_intent_id: response.data.payment_intent_id,
                publishable_key: response.data.publishable_key,
            };
        }

        return {
            success: false,
            message: response.data.message
        }
    }).catch((e: AxiosError) => {
        throw e;
    });
};

export const confirmPayment = async (
    invoiceId: string,
    paymentIntentId: string
): Promise<PaymentConfirmResponse> => {
    try {
        const response = await axiosInstance.put(`${baseUrl}/payments/invoices/${invoiceId}/confirm`, {
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

/**
 * Validate promotion code
 */
export const validatePromotionCode = async (code: string, priceTotal: number) => {
    return axiosInstance
        .post(`${baseUrl}/promotions/validate`, {
            code: code,
            order_amount: priceTotal
        }, {
            validateStatus: (status) => {
                // status code 200-499 is success
                return status >= 200 && status < 500;
            }
        })
        .then((response) => {
            return response.data;
        })
        .catch((e: AxiosError) => {
            throw e;
        });
};


/**
 * Espace-Pro
 */
export const getProCartDetails = async (paymentMethod: string) => {
    return axiosInstance
        .get(`${baseUrl}/pro-cart`, { params: { payment_method: paymentMethod } })
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

export const getPaymentMethods = async () => {
    return axiosInstance
        .get(`${baseUrl}/pro-cart/payment-methods`)
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

export const syncMembers = async (memberIds: string[]) => {
    return axiosInstance
        .put(`${baseUrl}/pro-cart/members`, { members: memberIds })
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

export const getTrainings = async () => {
    return axiosInstance
        .get(`${baseUrl}/pro-cart/trainings`)
        .then((response) => {
            if (response.data?.success == true) {
                return response.data.data;
            }

            return null;
        })
        .catch((e: AxiosError) => {
            throw e;
        });
}

export const addPackages = async (packageIds: string[]) => {
    return axiosInstance
        .put(`${baseUrl}/pro-cart/trainings`, {packageIds})
        .then((response) => {
            if (response.data?.success == true) {
                return response.data;
            }

            return false;
        })
        .catch((e: AxiosError) => {
            return false;
        });
};

export const previewProCart = async () => {
    return axiosInstance
        .get(`${baseUrl}/pro-cart/preview`)
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
 * Contract
 */
export const generateContract = async () => {
    return axiosInstance.post(`${baseUrl}/pro-cart/contract/generate`, {
        validateStatus: (status) => {
            // status code 200-499 is success
            return status >= 200 && status < 500;
        }
    }).then((response) => {
        return response.data?.data;
    }).catch((e: AxiosError) => {
        throw e;
    });
};

export const signContract = async (signData: any) => {
    return axiosInstance.post(`${baseUrl}/pro-cart/contract/sign`, { signData }, {
        validateStatus: (status) => {
            // status code 200-499 is success
            return status >= 200 && status < 500;
        }
    }).then((response) => {
        return response.data?.data;
    }).catch((e: AxiosError) => {
        throw e;
    });
};
