
import { z } from 'zod';
import { validators } from '@/utils/validation';

/**
 * Enhanced validateData function that properly types and formats errors
 */
export function validateData<T>(schema: z.ZodType<T>, data: unknown): { 
  success: true; 
  data: T; 
} | { 
  success: false; 
  errors: Record<string, string>; 
} {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format errors into a user-friendly object
      const formattedErrors: Record<string, string> = {};
      error.errors.forEach(err => {
        const path = err.path.join('.');
        formattedErrors[path] = err.message;
      });
      
      return { success: false, errors: formattedErrors };
    }
    
    // Handle unexpected errors
    return { 
      success: false, 
      errors: { _general: 'An unexpected validation error occurred' } 
    };
  }
}

/**
 * Helper to create a typed API response with validation
 */
export function withValidation<T, R>(
  schema: z.ZodType<T>,
  handler: (data: T) => Promise<R>
): (data: unknown) => Promise<{ success: true; data: R } | { success: false; errors: Record<string, string> }> {
  return async (data: unknown) => {
    const validationResult = validateData(schema, data);
    
    if (!validationResult.success) {
      return validationResult;
    }
    
    try {
      const result = await handler(validationResult.data);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error in validated handler:', error);
      return { 
        success: false, 
        errors: { _general: error instanceof Error ? error.message : 'An unknown error occurred' } 
      };
    }
  };
}

// Re-export validation functions for convenience
export { validators };
