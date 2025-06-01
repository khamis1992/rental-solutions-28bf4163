import { z } from 'zod';
import { handleApiError } from '@/lib/api/enhanced-error-handlers';
import { createValidationError } from '@/types/error.types';

/**
 * Validates data against a Zod schema
 */
export function validateData<T>(schema: z.ZodType<T>, data: unknown): 
  | { success: true; data: T }
  | { success: false; errors: Record<string, string> } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    throw error;
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
      return validationResult as { success: false; errors: Record<string, string> };
    }
    
    try {
      const result = await handler(validationResult.data);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error in validated handler:', error);
      handleApiError(createValidationError('Validation failed', { errors: error instanceof Error ? error.message : 'An unknown error occurred' }));
      return { 
        success: false, 
        errors: { _general: error instanceof Error ? error.message : 'An unknown error occurred' } 
      };
    }
  };
}

