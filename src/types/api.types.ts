import { PostgrestError } from '@supabase/supabase-js';

/**
 * Base API response type
 */
export type ApiResponse<T = any> = {
  success: boolean;
  data: T | null;
  error: any;
};

/**
 * API error type
 */
export type ApiError = {
  code: string;
  message: string;
  details?: any;
};

/**
 * Paginated response type
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Service response type (for internal services)
 */
export interface ServiceResponse<T> {
  success: boolean;
  data: T | null;
  error: string | Error | null;
  message?: string;
}

/**
 * Database response type (for Supabase responses)
 */
export interface DatabaseResponse<T> {
  data: T | null;
  error: PostgrestError | null;
}

/**
 * Type guard for paginated responses
 */
export function isPaginatedResponse<T>(value: unknown): value is PaginatedResponse<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'items' in value &&
    'total' in value &&
    'page' in value &&
    'pageSize' in value &&
    'totalPages' in value
  );
}

/**
 * Helper to create a success response
 */
export function createSuccessResponse<T>(data: T) {
  return {
    success: true,
    data,
    error: null
  };
}

/**
 * Helper to create an error response
 */
export function createErrorResponse(error: any) {
  return {
    success: false,
    error,
    data: null
  };
} 