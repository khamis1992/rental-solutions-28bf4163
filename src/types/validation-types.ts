
/**
 * Types for traffic fine validation
 */
export interface ValidationAttempt {
  id: string;
  license_plate: string;
  validation_date: string;
  status: string;
  result?: any;
  error_message?: string;
}

export interface ValidationResult {
  success: boolean;
  data?: ValidationAttempt;
  error?: Error | string;
}

/**
 * Type guard to check if a response object is a valid ValidationAttempt
 */
export function isValidationAttempt(obj: any): obj is ValidationAttempt {
  return (
    obj &&
    typeof obj === 'object' &&
    'id' in obj &&
    'license_plate' in obj &&
    'validation_date' in obj &&
    'status' in obj
  );
}
