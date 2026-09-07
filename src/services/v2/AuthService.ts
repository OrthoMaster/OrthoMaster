import { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance, { authEvents, baseUrl } from './axiosInstance';

export { authEvents };

// Constants
const AUTH_TOKEN_KEY = 'JWT';
const USER_DATA_KEY = 'user';

// Base URL
const authUrl = baseUrl + '/auth';

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
  fcm_token: string,
  device_id: string,
  device_type: string,
}

interface ForgotParam {
  email: string
}

/**
 * Login with email & password
 */
export const login = async ({ email, password, fcm_token, device_id, device_type }: LoginParams) => {
  return axiosInstance
    .post(`${authUrl}/login`, {
      email,
      password,
      fcm_token,
      device_id,
      device_type
    })
    .then((response) => {
      return response.data;
    })
    .catch((e: AxiosError) => {
      throw e;
    });
};

/**
 * Logout - Revoke token on server
 */
export const logout = async () => {
  return axiosInstance
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
  return axiosInstance
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
  return axiosInstance
    .get(`${authUrl}/more`)
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
  return axiosInstance
    .get(`${baseUrl}/notifications/lastest`)
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

/**
 * Get notifications
 */
export const getNotifications = async () => {
  return axiosInstance
    .get(`${baseUrl}/notifications`)
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

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async () => {
  return axiosInstance
    .post(`${baseUrl}/notifications/read`)
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

/**
 * Mark all notifications as read
 */
export const deleteAllNotification = async () => {
  return axiosInstance
    .delete(`${baseUrl}/notifications`)
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

/**
 * Mark notification as read
 */
export const markAsRead = async (notiId: string) => {
  return axiosInstance
    .put(`${baseUrl}/notifications/${notiId}/read`)
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

/**
 * Delete a notification
 */
export const deleteNotification = async (notiId: string) => {
  return axiosInstance
    .delete(`${baseUrl}/notifications/${notiId}`)
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

/**
 * Accept a confirm notification
 */
export const acceptNotification = async (notiId: string) => {
  return axiosInstance
    .put(`${baseUrl}/notifications/${notiId}/accept`)
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

/**
 * Reject a confirm notification
 */
export const rejectNotification = async (notiId: string) => {
  return axiosInstance
    .put(`${baseUrl}/notifications/${notiId}/reject`)
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

/**
 * Prepare data before form
 */
export const getPreFormData = async () => {
  return axiosInstance
    .get(`${baseUrl}/profile/pre-data`)
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
  return axiosInstance
    .put(`${baseUrl}/profile`, data)
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

/**
 * Update notification permission
 */
export const updateNotiPermission = async (
  data: {
    notifications: boolean,
  }) => {

  return axiosInstance
    .put(`${baseUrl}/profile/notifications`, {
      notifications: data.notifications,
    })
    .then((response) => {
      if (response.data?.success == true) {
        return true;
      }
      return false;
    })
    .catch((e: AxiosError) => {
      return false;
    });
}

/**
 * Update settings
 */
export const updateSettings = async (
  data: {
    notifications: boolean,
    favoriteTopicIds: string[],
  }) => {

  return axiosInstance
    .put(`${baseUrl}/profile/settings`, {
      notifications: data.notifications,
      topicIds: data.favoriteTopicIds
    })
    .then((response) => {
      if (response.data?.success == true) {
        return true;
      }
      return false;
    })
    .catch((e: AxiosError) => {
      return false;
    });
}

/**
 * Add 1 topic
 */
export const addTopic = async (topicId: string) => {

  return axiosInstance
    .put(`${baseUrl}/profile/topics/add`, { topicId })
    .then((response) => {
      if (response.data?.success == true) {
        return true;
      }
      return false;
    })
    .catch((e: AxiosError) => {
      return false;
    });
}

/**
 * Change password
 */
export const changePassword = async (data: {
  new_password: string
  new_password_confirmation: string
}) => {
  return axiosInstance
    .post(`${baseUrl}/profile/password`, data)
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

/**
 * Documents
 */
export const getDocument = async () => {
  return axiosInstance
    .get(`${baseUrl}/documents`)
    .then((response) => {
      if (response.data?.success == true) {
        return response.data?.data;
      }

      return false;
    })
    .catch((e: AxiosError) => {
      return false;
    });
}

/**
 * Send error to server
 */
export const sendError = async (code: string, error: any) => {
  return axiosInstance
    .post(`${baseUrl}/tracking/error`, { code, error });
}

/**
 * Enregistre le jeton de notification de l'appareil.
 * POST /device-token
 */
export const syncDeviceToken = async (payload: {
  fcm_token: string;
  device_id: string;
  device_type?: string;
}) => {
  return axiosInstance
    .post(`${baseUrl}/device-token`, payload)
    .then((response) => {
      if (response.data?.success == true) {
        return true;
      }
      return false;
    })
    .catch((e: AxiosError) => {
      return false;
    });
}