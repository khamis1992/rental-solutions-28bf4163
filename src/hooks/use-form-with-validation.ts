import { useState, useCallback } from 'react';
import { z } from 'zod';

/**
 * A custom hook for form validation using Zod schemas
 */
export const useFormWithValidation = <T extends z.ZodType>(schema: T) => {
  type FormData = z.infer<typeof schema>;
  
  const [formData, setFormData] = useState<Partial<FormData>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when it changes
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
  }, []);
  
  const validate = useCallback(() => {
    try {
      schema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          const path = err.path.join('.');
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  }, [formData, schema]);
  
  const handleSubmit = useCallback(async (onSubmit: (data: FormData) => Promise<void>) => {
    setIsSubmitting(true);
    
    if (validate()) {
      try {
        await onSubmit(formData as FormData);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }
    
    setIsSubmitting(false);
  }, [formData, validate]);
  
  return {
    formData,
    errors,
    isSubmitting,
    handleChange,
    validate,
    handleSubmit,
    setFormData
  };
};

export default useFormWithValidation;
