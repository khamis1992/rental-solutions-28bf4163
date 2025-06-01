import { handleError, handleSuccess, createDetailedError } from '../errors/error-handler';
import { type ApiResponse } from '@/types/api.types';

// Re-export the centralized error handling functions
export { handleError, handleSuccess, createDetailedError };

// Export type for backward compatibility
export type { ApiResponse };
