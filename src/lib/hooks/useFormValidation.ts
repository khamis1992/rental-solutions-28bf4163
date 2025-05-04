
import { useState } from 'react';
import { z } from 'zod';
import { useToast } from '@/components/ui/use-toast';

export function useFormValidation<T extends z.ZodType<any, any>>(schema: T) {
  const { toast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (data: any): data is z.infer<T> => {
    try {
      schema.parse(data);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          formattedErrors[path] = err.message;
        });
        setErrors(formattedErrors);
        
        // Show toast for the first error
        const firstError = error.errors[0];
        toast({
          title: 'Validation Error',
          description: firstError.message,
          variant: 'destructive',
        });
      }
      return false;
    }
  };

  const validateField = <K extends keyof z.infer<T>>(field: K, value: z.infer<T>[K]): boolean => {
    try {
      const fieldSchema = schema.shape[field as string];
      if (fieldSchema) {
        fieldSchema.parse(value);
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated[field as string];
          return updated;
        });
        return true;
      }
      return false;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors((prev) => ({
          ...prev,
          [field as string]: error.errors[0]?.message || 'Invalid value',
        }));
      }
      return false;
    }
  };

  return {
    errors,
    validateForm,
    validateField,
    hasErrors: Object.keys(errors).length > 0
  };
}
