
import { useState, useCallback } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';

interface ValidationOptions<T> {
  schema?: z.ZodType<T>;
  onSuccess?: (data: T) => void | Promise<void>;
  onError?: (error: z.ZodError) => void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

interface FormState<T> {
  values: Partial<T>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

export function useFormWithValidation<T extends Record<string, any>>(
  initialValues: Partial<T> = {},
  options: ValidationOptions<T> = {}
) {
  const [formState, setFormState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: true,
  });

  const validateField = useCallback(
    (name: keyof T, value: any) => {
      if (!options.schema) return '';

      try {
        // Create a partial schema with just this field
        const partialSchema = z.object({ [name]: options.schema.shape[name] });
        partialSchema.parse({ [name]: value });
        return '';
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldError = error.errors.find((e) => e.path[0] === name);
          return fieldError?.message || '';
        }
        return 'Invalid value';
      }
    },
    [options.schema]
  );

  const validateForm = useCallback(
    (values: Partial<T>) => {
      if (!options.schema) return { isValid: true, errors: {} };

      try {
        options.schema.parse(values);
        return { isValid: true, errors: {} };
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errors = error.errors.reduce(
            (acc, curr) => {
              const path = curr.path[0] as string;
              acc[path] = curr.message;
              return acc;
            },
            {} as Record<string, string>
          );
          return { isValid: false, errors };
        }
        return { isValid: false, errors: { form: 'Invalid form data' } };
      }
    },
    [options.schema]
  );

  const setFieldValue = useCallback(
    (name: keyof T, value: any) => {
      const newValues = { ...formState.values, [name]: value };
      
      setFormState((prev) => {
        const newState = { ...prev, values: newValues };
        
        if (options.validateOnChange) {
          const error = validateField(name, value);
          newState.errors = { ...prev.errors, [name]: error };
          newState.isValid = Object.values(newState.errors).every((e) => !e);
        }
        
        return newState;
      });
    },
    [formState.values, options.validateOnChange, validateField]
  );

  const setFieldTouched = useCallback(
    (name: keyof T, isTouched: boolean = true) => {
      setFormState((prev) => {
        const newState = {
          ...prev,
          touched: { ...prev.touched, [name]: isTouched },
        };
        
        if (options.validateOnBlur && isTouched) {
          const error = validateField(name, prev.values[name]);
          newState.errors = { ...prev.errors, [name]: error };
          newState.isValid = Object.values(newState.errors).every((e) => !e);
        }
        
        return newState;
      });
    },
    [options.validateOnBlur, validateField]
  );

  const setValues = useCallback(
    (newValues: Partial<T>) => {
      setFormState((prev) => {
        const updatedValues = { ...prev.values, ...newValues };
        let updatedState = { ...prev, values: updatedValues };
        
        if (options.validateOnChange) {
          const validation = validateForm(updatedValues);
          updatedState = {
            ...updatedState,
            errors: validation.errors,
            isValid: validation.isValid,
          };
        }
        
        return updatedState;
      });
    },
    [options.validateOnChange, validateForm]
  );

  const resetForm = useCallback(
    (newValues: Partial<T> = {}) => {
      setFormState({
        values: newValues,
        errors: {},
        touched: {},
        isSubmitting: false,
        isValid: true,
      });
    },
    []
  );

  const handleSubmit = useCallback(
    async (event?: React.FormEvent) => {
      if (event) {
        event.preventDefault();
      }

      setFormState((prev) => ({ ...prev, isSubmitting: true }));

      const validation = validateForm(formState.values);

      if (!validation.isValid) {
        setFormState((prev) => ({
          ...prev,
          errors: validation.errors,
          isValid: false,
          isSubmitting: false,
        }));

        // Show first error in toast
        const firstError = Object.values(validation.errors)[0];
        if (firstError) {
          toast.error(firstError);
        }

        if (options.onError) {
          options.onError(new z.ZodError([])); // Placeholder for now
        }

        return false;
      }

      try {
        if (options.onSuccess) {
          await options.onSuccess(formState.values as T);
        }
        return true;
      } catch (error) {
        console.error('Form submission error:', error);
        toast.error('An error occurred while submitting the form');
        return false;
      } finally {
        setFormState((prev) => ({ ...prev, isSubmitting: false }));
      }
    },
    [formState.values, options, validateForm]
  );

  return {
    values: formState.values,
    errors: formState.errors,
    touched: formState.touched,
    isSubmitting: formState.isSubmitting,
    isValid: formState.isValid,
    setFieldValue,
    setFieldTouched,
    setValues,
    resetForm,
    handleSubmit,
  };
}
