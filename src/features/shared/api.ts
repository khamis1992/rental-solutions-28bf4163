import { 
  ApiResponse, 
  createErrorResponse, 
  createSuccessResponse,
  ApiError
} from '../../types/api.types';
import { handleError } from '@/lib/errors/error-handler';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const createPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResponse<T> => {
  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

// Re-export the centralized error handler
export { handleError };

// Export types and response creators for backward compatibility
export type { ApiResponse, ApiError };
export { createErrorResponse, createSuccessResponse };
