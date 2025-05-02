
/**
 * Type-safe error handling utilities for traffic fine validation
 */

import { getErrorMessage } from '@/utils/error-handling';

// Define specific error types for traffic fine validation
export interface ValidationError {
  code: string;
  message: string;
  licensePlate: string;
  details?: unknown;
  environment?: 'development' | 'production';
}

export const ErrorCodes = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INVALID_LICENSE_PLATE: 'INVALID_LICENSE_PLATE',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  DEVELOPMENT_MODE: 'DEVELOPMENT_MODE',
};

/**
 * Creates a standardized validation error object
 */
export function createValidationError(
  licensePlate: string,
  code: string = ErrorCodes.VALIDATION_FAILED,
  message: string = 'Validation failed',
  details?: unknown,
  environment?: 'development' | 'production'
): ValidationError {
  return {
    code,
    message,
    licensePlate,
    details,
    environment,
  };
}

/**
 * Maps caught errors to structured validation error objects
 */
export function mapToValidationError(error: unknown, licensePlate: string): ValidationError {
  const errorMsg = getErrorMessage(error);
  
  // Check if this is a development mode error
  if (errorMsg.includes('development') || errorMsg.includes('dev mode')) {
    return createValidationError(
      licensePlate,
      ErrorCodes.DEVELOPMENT_MODE,
      `Development mode validation for ${licensePlate}: ${errorMsg}`,
      error,
      'development'
    );
  }
  
  // Classify error types
  if (errorMsg.includes('network') || errorMsg.includes('connection')) {
    return createValidationError(
      licensePlate,
      ErrorCodes.NETWORK_ERROR,
      `Network error while validating ${licensePlate}: ${errorMsg}`
    );
  }
  
  if (errorMsg.includes('rate') || errorMsg.includes('limit')) {
    return createValidationError(
      licensePlate,
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      `Rate limit exceeded while validating ${licensePlate}`
    );
  }
  
  if (errorMsg.includes('invalid') || errorMsg.includes('format')) {
    return createValidationError(
      licensePlate,
      ErrorCodes.INVALID_LICENSE_PLATE,
      `Invalid license plate format: ${licensePlate}`
    );
  }
  
  return createValidationError(
    licensePlate,
    ErrorCodes.UNKNOWN_ERROR,
    `Error validating ${licensePlate}: ${errorMsg}`,
    error
  );
}

/**
 * Groups validation errors by error code for better reporting
 */
export function groupValidationErrors(errors: ValidationError[]): Record<string, ValidationError[]> {
  return errors.reduce((grouped, error) => {
    if (!grouped[error.code]) {
      grouped[error.code] = [];
    }
    grouped[error.code].push(error);
    return grouped;
  }, {} as Record<string, ValidationError[]>);
}

/**
 * Generate a summary message from grouped validation errors
 */
export function generateErrorSummary(groupedErrors: Record<string, ValidationError[]>): string {
  const summary: string[] = [];
  
  const totalErrors = Object.values(groupedErrors).flat().length;
  
  if (totalErrors === 0) {
    return '';
  }
  
  summary.push(`Encountered ${totalErrors} validation errors:`);
  
  Object.entries(groupedErrors).forEach(([code, errors]) => {
    switch (code) {
      case ErrorCodes.NETWORK_ERROR:
        summary.push(`• Network errors (${errors.length}): Check your connection`);
        break;
      case ErrorCodes.RATE_LIMIT_EXCEEDED:
        summary.push(`• Rate limit exceeded (${errors.length}): Try again later`);
        break;
      case ErrorCodes.INVALID_LICENSE_PLATE:
        summary.push(`• Invalid license plates (${errors.length}): Please check formats`);
        break;
      case ErrorCodes.DEVELOPMENT_MODE:
        summary.push(`• Development mode validations (${errors.length}): Running in test mode`);
        break;
      default:
        summary.push(`• ${code} (${errors.length}): ${errors[0].message}`);
    }
  });
  
  return summary.join('\n');
}

/**
 * Determine if we're in development mode for client-side code
 */
export function isInDevelopmentMode(): boolean {
  // Check for development indicators in the environment
  return (
    process.env.NODE_ENV === 'development' || 
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );
}
