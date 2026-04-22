import { AxiosError } from 'axios';
import axiosInstance, { baseUrl } from './axiosInstance';

/**
 * Get user's company
 */
export const getCompany = async () => {
  return axiosInstance
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
  return axiosInstance
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
  return axiosInstance
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
 * Quit Company as Member
 */
export const quitCompany = async (selectedCompanyId: number) => {
  return axiosInstance
    .patch(`${baseUrl}/company/quit`, {company_id : selectedCompanyId})
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
 * Remove Company as Manager
 */
export const removeCompany = async () => {
  return axiosInstance
    .patch(`${baseUrl}/company/remove`)
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
  return axiosInstance
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
  return axiosInstance
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
  return axiosInstance
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
  return axiosInstance
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

/**
 * Send request pre-inscription diploma
 */
export const preRegDiploma = async () => {
  return axiosInstance
    .post(`${baseUrl}/pre-reg/diploma`)
    .then((response) => {
      return response.data;
    })
    .catch((e: AxiosError) => {
      return {
        success: false,
        message: (e.response?.data as any)?.message || 'Une erreur est survenue',
      };
    });
};