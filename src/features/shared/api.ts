import { 
  ApiResponse, 
  createErrorResponse, 
  createSuccessResponse,
  type AppError
} from '../../types/error.types';
import { handleApiError } from '@/lib/errors/error-handler';

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

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
export { handleApiError };

// Export types and response creators for backward compatibility
export type { ApiResponse, AppError };
export { createErrorResponse, createSuccessResponse };
