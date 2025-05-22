import { ZodError } from 'zod';

/**
 * Formats ZodError validation errors into a Record<string, string> format
 * that can be used with the existing formatValidationErrors function
 */
export function formatZodErrors(error: ZodError): Record<string, string[]> {
  const formattedErrors: Record<string, string[]> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    const field = path || 'form';
    
    if (!formattedErrors[field]) {
      formattedErrors[field] = [];
    }
    
    formattedErrors[field].push(err.message);
  });
  
  return formattedErrors;
}
