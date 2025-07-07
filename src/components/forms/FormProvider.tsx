import React, { createContext, useContext, useState, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

interface FormContextType {
  formData: Record<string, any>;
  errors: Record<string, string>;
  isSubmitting: boolean;
  updateField: (field: string, value: any) => void;
  setFieldError: (field: string, error: string) => void;
  clearErrors: () => void;
  submitForm: (onSubmit: (data: Record<string, any>) => Promise<void>) => Promise<void>;
}

interface FormProviderProps {
  children: React.ReactNode;
  form?: UseFormReturn<any>;
  onSubmit?: (data: any) => Promise<void> | void;
  className?: string;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
};

export const FormProvider: React.FC<FormProviderProps> = ({ 
  children, 
  form, 
  onSubmit,
  className 
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const setFieldError = useCallback((field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const submitForm = useCallback(async (onSubmitCallback: (data: Record<string, any>) => Promise<void>) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    clearErrors();

    try {
      await onSubmitCallback(formData);
      toast.success('تم حفظ البيانات بنجاح');
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('حدث خطأ أثناء حفظ البيانات');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isSubmitting, clearErrors]);

  const contextValue: FormContextType = {
    formData,
    errors,
    isSubmitting,
    updateField,
    setFieldError,
    clearErrors,
    submitForm
  };

  const containerClass = className ? ` ${className}` : '';

  return (
    <FormContext.Provider value={contextValue}>
      <div className={`form-provider${containerClass}`}>
        {children}
      </div>
    </FormContext.Provider>
  );
};