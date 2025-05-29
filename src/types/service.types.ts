
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string | Error;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string | Error;
  message?: string;
}

// Type guard for service results
export function isServiceError<T>(result: ServiceResult<T>): result is ServiceResult<T> & { success: false; error: string | Error } {
  return !result.success && !!result.error;
}

// Helper to extract error message from various error types
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return 'An unknown error occurred';
}
