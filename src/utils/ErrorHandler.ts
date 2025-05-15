// src/utils/ErrorHandler.ts

import { sessionError } from "../services/SessionEventService";

export function setupGlobalErrorHandling() {
  // Global JS errors
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    // Tu peux envoyer ça à Sentry, LogRocket ou ton backend ici
    sessionError({
      name: 'GlobalError',
      message: error.message,
      stack_trace: error.stack || '',
      context: {
        isFatal: isFatal
      }
    });
  });

}
