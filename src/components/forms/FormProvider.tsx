
import React, { createContext, useContext, useState, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { errorLogger } from '@/lib/errors/error-logger';

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

export const useForm = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useForm must be used within a FormProvider');
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
    setIsSubmitting(true);
    try {
      if (form && onSubmit) {
        await form.handleSubmit(onSubmit)();
      } else {
        await onSubmitCallback(formData);
      }
      toast.success('Form submitted successfully', {
        action: {
          label: 'Dismiss',
          onClick: () => {}
        }
      });
    } catch (error) {
      errorLogger.logError(error as Error, {
        context: 'FormProvider.submitForm',
        formData: formData,
        timestamp: new Date().toISOString()
      });
      toast.error('Failed to submit form');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, form, onSubmit]);

  const value: FormContextType = {
    formData,
    errors,
    isSubmitting,
    updateField,
    setFieldError,
    clearErrors,
    submitForm
  };

  const formElement = (
    <FormContext.Provider value={value}>
      {children}
    </FormContext.Provider>
  );

  if (form && onSubmit) {
    return (
      <form onSubmit={form.handleSubmit(onSubmit)} className={className}>
        {formElement}
      </form>
    );
  }

  return <div className={className}>{formElement}</div>;
};
