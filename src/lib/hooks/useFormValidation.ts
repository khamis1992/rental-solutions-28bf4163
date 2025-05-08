
import { useState } from 'react';

/**
 * Generic form validation hook for handling form validation
 */
export function useFormValidation<T extends Record<string, any>>(initialErrors: Partial<Record<keyof T, string>> = {}) {
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>(initialErrors);

  /**
   * Validate a single field
   */
  const validateField = <K extends keyof T>(
    field: K,
    value: T[K],
    rules: ((value: T[K]) => string | null)[]
  ): string | null => {
    for (const rule of rules) {
      const error = rule(value);
      if (error) {
        setErrors(prev => ({ ...prev, [field]: error }));
        return error;
      }
    }

    // Clear error for this field
    setErrors(prev => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });

    return null;
  };

  /**
   * Validate entire form data object against a schema of rules
   */
  const validateForm = (
    data: T,
    schema: Record<keyof T, Array<(value: any) => string | null>>
  ): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    for (const field in schema) {
      if (Object.prototype.hasOwnProperty.call(schema, field)) {
        const rules = schema[field];
        const value = data[field];
        
        for (const rule of rules) {
          const error = rule(value);
          if (error) {
            newErrors[field] = error;
            isValid = false;
            break;
          }
        }
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  /**
   * Set a specific error manually
   */
  const setError = <K extends keyof T>(field: K, message: string | null) => {
    setErrors(prev => {
      if (message === null) {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      }
      return { ...prev, [field]: message };
    });
  };

  /**
   * Clear all errors
   */
  const clearErrors = () => {
    setErrors({});
  };

  return {
    errors,
    validateField,
    validateForm,
    setError,
    clearErrors,
    hasErrors: Object.keys(errors).length > 0
  };
}

export default useFormValidation;
