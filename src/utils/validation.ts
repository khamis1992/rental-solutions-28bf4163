/**
 * Validation utilities using Zod schemas
 * Provides consistent data validation across the application
 */
import { z } from 'zod';
import { handleError } from './error-handler';

/**
 * Validate data against a Zod schema
 * @param schema The Zod schema to validate against
 * @param data The data to validate
 * @param options Options for validation
 * @returns The validated data or null if validation fails
 */
export function validateData<T>(
  schema: z.ZodType<T>, 
  data: unknown, 
  options: {
    context?: string;
    throwOnError?: boolean;
  } = {}
): T | null {
  try {
    const result = schema.parse(data);
    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedError = {
        message: 'Validation error',
        errors: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      };
      
      handleError(formattedError, { 
        context: options.context || 'Data validation',
        silent: !options.throwOnError
      });
      
      if (options.throwOnError) {
        throw formattedError;
      }
    } else {
      handleError(error, { 
        context: options.context || 'Data validation',
        silent: !options.throwOnError
      });
      
      if (options.throwOnError) {
        throw error;
      }
    }
    
    return null;
  }
}

/**
 * Safe validate data against a Zod schema
 * Returns the validation result and any errors
 * @param schema The Zod schema to validate against
 * @param data The data to validate
 * @returns Object containing the validation result and any errors
 */
export function safeValidateData<T>(
  schema: z.ZodType<T>,
  data: unknown
): { 
  success: boolean; 
  data: T | null; 
  errors: { path: string; message: string }[] | null;
} {
  try {
    const result = schema.parse(data);
    return {
      success: true,
      data: result,
      errors: null
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      };
    } else {
      // Handle unexpected errors
      handleError(error, { context: 'Data validation', silent: true });
      return {
        success: false,
        data: null,
        errors: [{ path: '', message: 'Unexpected validation error' }]
      };
    }
  }
}
