// fairplay/fairplay.ts

// ===== TYPES =====
export interface FairPlayConfig {
  certificateUrl: string;
  applicationSecretKey: string;
  licenseServerUrl: string;
}

export interface FairPlayDRMConfig {
  type: 'fairplay';
  licenseServer: string;
  certificateUrl: string;
}

export interface VideoSourceWithDRM {
  uri: string;
  drm: FairPlayDRMConfig;
}

// ===== CONFIG =====
export const fairplayConfig: FairPlayConfig = {
  certificateUrl: require('../../certificates/fairplay.pem'),
  applicationSecretKey: process.env.FAIRPLAY_ASK || '',
  licenseServerUrl: process.env.FAIRPLAY_LICENSE_SERVER_URL || 'https://your-license-server.com/license',
};

// ===== UTILITIES =====
export const validateFairPlayConfig = (config: FairPlayConfig): boolean => {
  return !!(config.certificateUrl && config.applicationSecretKey && config.licenseServerUrl);
};

export const createFairPlayDRMConfig = (): FairPlayDRMConfig => ({
  type: 'fairplay',
  licenseServer: fairplayConfig.licenseServerUrl,
  certificateUrl: fairplayConfig.certificateUrl,
});

// ===== CONSTANTS =====
export const FAIRPLAY_ERRORS = {
  INVALID_CONFIG: 'FairPlay configuration is incomplete or invalid',
  MISSING_ASK: 'Application Secret Key is missing',
  MISSING_CERTIFICATE: 'Certificate URL is missing',
  MISSING_LICENSE_SERVER: 'License server URL is missing',
} as const;

// ===== HELPER FUNCTIONS =====
export const getFairPlayError = (config: FairPlayConfig): string | null => {
  if (!config.applicationSecretKey) return FAIRPLAY_ERRORS.MISSING_ASK;
  if (!config.certificateUrl) return FAIRPLAY_ERRORS.MISSING_CERTIFICATE;
  if (!config.licenseServerUrl) return FAIRPLAY_ERRORS.MISSING_LICENSE_SERVER;
  return null;
};

// ===== DEFAULT EXPORT =====
export default {
  config: fairplayConfig,
  validate: validateFairPlayConfig,
  createDRMConfig: createFairPlayDRMConfig,
  errors: FAIRPLAY_ERRORS,
  getError: getFairPlayError,
};