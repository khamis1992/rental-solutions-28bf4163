import { handleError as handleApiError, handleSuccess } from './error-handlers';

// Re-export the centralized error handling functions
export { handleApiError };
export { handleSuccess as handleApiSuccess };
