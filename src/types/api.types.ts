import { PostgrestError } from '@supabase/supabase-js';
import { 
  ApiResponse as StandardApiResponse,
  AppError as StandardApiError,
  isSuccessResponse as isStandardApiResponse,
  isAppError as isStandardApiError,
  createErrorResponse as createStandardErrorResponse,
  createSuccessResponse as createStandardSuccessResponse
} from './error.types';

/**
 * Base API response type
 */
export type ApiResponse<T = any> = StandardApiResponse<T>;

/**
 * API error type
 */
export type ApiError = StandardApiError;

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
 * Type guard for API responses
 */
export const isApiResponse = isStandardApiResponse;

/**
 * Type guard for API errors
 */
export const isApiError = isStandardApiError;

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
export const createSuccessResponse = createStandardSuccessResponse;

/**
 * Helper to create an error response
 */
export const createErrorResponse = createStandardErrorResponse;

/**
 * Helper to create a paginated response
 */
export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResponse<T> {
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
} 