
import { ValidationError } from './types';

/**
 * Maps an error to a structured validation error
 */
export const mapToValidationError = (error: any, licensePlate: string): ValidationError => {
  // Determine if it's already a ValidationError
  if (error && typeof error === 'object' && 'code' in error && 'licensePlate' in error) {
    return error as ValidationError;
  }

  // Default error code
  let code = 'VALIDATION_ERROR';
  let message = error instanceof Error ? error.message : String(error);

  // Try to extract more specific error information
  if (error instanceof Error) {
    if (message.includes('timeout')) {
      code = 'TIMEOUT_ERROR';
      message = 'The validation request timed out';
    } else if (message.includes('rate limit') || message.includes('429')) {
      code = 'RATE_LIMIT_ERROR';
      message = 'Rate limit exceeded for validation requests';
    } else if (message.includes('network') || message.includes('connection')) {
      code = 'NETWORK_ERROR';
      message = 'Network error during validation request';
    }
  }

  return {
    code,
    message,
    licensePlate,
    timestamp: new Date(),
    details: error
  };
};

/**
 * Groups validation errors by error code
 */
export const groupValidationErrors = (errors: ValidationError[]): Record<string, ValidationError[]> => {
  return errors.reduce<Record<string, ValidationError[]>>((acc, error) => {
    if (!acc[error.code]) {
      acc[error.code] = [];
    }
    acc[error.code].push(error);
    return acc;
  }, {});
};

/**
 * Generates a human-readable summary of validation errors
 */
export const generateErrorSummary = (groupedErrors: Record<string, ValidationError[]>): string => {
  const errorTypes = Object.keys(groupedErrors);
  
  if (errorTypes.length === 0) {
    return 'No errors encountered';
  }

  return errorTypes.map(code => {
    const count = groupedErrors[code].length;
    let message = groupedErrors[code][0].message;
    
    // Trim the message if it's too long
    if (message.length > 100) {
      message = message.substring(0, 97) + '...';
    }
    
    return `${count} ${count === 1 ? 'instance' : 'instances'} of ${code}: ${message}`;
  }).join('. ');
};
