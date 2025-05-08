
// Export validation utility functions

/**
 * Common validators for form fields
 */
export const validators = {
  required: (value: any, message = 'This field is required') => 
    value !== undefined && value !== null && value !== '' ? null : message,
  
  email: (value: string, message = 'Invalid email format') => 
    !value || /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value) ? null : message,
  
  phone: (value: string, message = 'Invalid phone number') => 
    !value || /^\+?[0-9]{10,15}$/.test(value.replace(/[^0-9+]/g, '')) ? null : message,
  
  minLength: (min: number) => (value: string, message = `Must be at least ${min} characters`) => 
    !value || value.length >= min ? null : message,
  
  maxLength: (max: number) => (value: string, message = `Cannot exceed ${max} characters`) => 
    !value || value.length <= max ? null : message,
  
  numeric: (value: string, message = 'Must be a number') => 
    !value || !isNaN(Number(value)) ? null : message,
  
  positiveNumber: (value: number, message = 'Must be a positive number') => 
    value === null || value === undefined || value > 0 ? null : message,
    
  dateFormat: (value: string, message = 'Invalid date format') => 
    !value || /^\d{4}-\d{2}-\d{2}$/.test(value) ? null : message,
};

/**
 * Utility function to run multiple validators on a value
 */
export function validateWithRules(value: any, rules: Array<(value: any) => string | null>): string | null {
  for (const rule of rules) {
    const error = rule(value);
    if (error) return error;
  }
  return null;
}

/**
 * Utility function to validate an object against a schema
 */
export function validateObject<T extends Record<string, any>>(
  data: Record<string, any>,
  schema: Record<string, Array<(value: any) => string | null>>
): { isValid: boolean; errors: Record<string, string | null> } {
  const errors: Record<string, string | null> = {};
  let isValid = true;
  
  Object.entries(schema).forEach(([field, validators]) => {
    const value = data[field];
    const error = validateWithRules(value, validators);
    
    if (error) {
      isValid = false;
      errors[field] = error;
    }
  });
  
  return { isValid, errors };
}
