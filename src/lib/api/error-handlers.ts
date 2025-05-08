
// Fix the error handler to handle ServiceResult properly

import { toast } from 'sonner';

// Define the ServiceResult type
export type ServiceResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string>;
  meta?: Record<string, any>;
};

/**
 * Handles service result errors with appropriate UI feedback
 */
export function handleServiceError<T>(result: ServiceResult<T>, fallbackMessage = 'An error occurred'): void {
  if (!result.success) {
    let message: string;
    
    if (result.error) {
      message = result.error;
    } else if (result.errors) {
      message = Object.values(result.errors).join(', ');
    } else {
      message = fallbackMessage;
    }
    
    toast.error('Error', {
      description: message,
    });
    
    console.error('Service error:', { 
      message, 
      errors: result.errors,
      meta: result.meta 
    });
  }
}

/**
 * Handles API errors with appropriate UI feedback
 */
export function handleApiError(error: unknown, context?: string): void {
  console.error('API Error:', error);
  
  let errorMessage = 'An unexpected error occurred';
  
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }
  
  if (context) {
    errorMessage = `${context}: ${errorMessage}`;
  }
  
  toast.error('Error', {
    description: errorMessage,
  });
}
