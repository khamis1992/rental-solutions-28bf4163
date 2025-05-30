import { handleApiError, handleApiSuccess, createDetailedError } from '@/lib/errors/error-handler';
import { type ApiResponse } from '@/types/error.types';

// Re-export the centralized error handling functions
export { handleApiError, handleApiSuccess, createDetailedError };

// Export type for backward compatibility
export type { ApiResponse };
