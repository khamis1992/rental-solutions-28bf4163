import { AppError } from '@/types/error.types';

/**
 * Type validation utility functions
 */

// Utility function to validate JSON string
export const isValidJSONString = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

// Utility function to validate array
export const isValidArray = <T>(arr: unknown): arr is T[] => {
  return Array.isArray(arr);
};

// Utility function to validate object
export const isValidObject = <T extends Record<string, unknown>>(obj: unknown): obj is T => {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
};

/**
 * Type guard to check if a value is a valid boolean
 */
export const isValidBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

/**
 * Type guard to check if a value is null or undefined
 */
export const isNullOrUndefined = (value: unknown): value is null | undefined => {
  return value === null || value === undefined;
};

// Utility function to validate empty array
export const isEmptyArray = <T>(arr: unknown): arr is T[] => {
  return Array.isArray(arr) && arr.length === 0;
};

// Utility function to validate empty object
export const isEmptyObject = <T extends Record<string, unknown>>(obj: unknown): obj is T => {
  return typeof obj === 'object' && obj !== null && Object.keys(obj).length === 0;
};

/**
 * Validation result interface with specific error types
 */
export interface ValidationResult {
  success: boolean;
  error?: AppError;
  message?: string;
  validationErrors?: Array<{
    field: string;
    message: string;
    code?: string;
    severity?: 'low' | 'medium' | 'high';
  }>;
}

/**
 * Type guard to check if a value is a valid ValidationResult
 */
export const isValidValidationResult = (value: unknown): value is ValidationResult => {
  if (!value || typeof value !== 'object') return false;
  const result = value as ValidationResult;
  return (
    typeof result.success === 'boolean' &&
    (!result.error || typeof result.error === 'object') &&
    (!result.message || typeof result.message === 'string') &&
    (!result.validationErrors || Array.isArray(result.validationErrors))
  );
};
