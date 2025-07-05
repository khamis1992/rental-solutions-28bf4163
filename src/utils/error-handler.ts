/**
 * Standardizes error handling across the application
 * @param error - The error to handle
 * @returns A standardized Error object
 */
export const handleError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String(error.message));
  }

  return new Error('An unknown error occurred');
};

/**
 * Creates a standardized error response
 * @param message - The error message
 * @param code - Optional error code
 * @returns A standardized error object
 */
export const createError = (message: string, code?: string): Error => {
  const error = new Error(message);
  if (code) {
    (error as any).code = code;
  }
  return error;
};

/**
 * Checks if an error is a specific type
 * @param error - The error to check
 * @param type - The type to check against
 * @returns Whether the error is of the specified type
 */
export const isErrorType = (error: unknown, type: string): boolean => {
  if (!error || typeof error !== 'object') return false;
  return (error as any).code === type;
}; 