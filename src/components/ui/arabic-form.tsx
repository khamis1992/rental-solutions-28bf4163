import React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createArabicFormLayout, arabicValidationMessages, createArabicErrorMessage } from '@/utils/arabic-rtl-utils';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface ArabicFormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'password' | 'textarea' | 'select';
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  className?: string;
  disabled?: boolean;
}

export const ArabicFormField: React.FC<ArabicFormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder,
  options = [],
  className,
  disabled = false,
}) => {
  const fieldId = `arabic-field-${name}`;
  
  const renderInput = () => {
    const baseProps = {
      id: fieldId,
      name,
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
      placeholder,
      disabled,
      className: cn(
        'text-right dir-rtl',
        error && 'border-red-500 focus:border-red-500',
        className
      ),
    };

    switch (type) {
      case 'textarea':
        return (
          <Textarea
            {...baseProps}
            rows={4}
          />
        );
      
      case 'select':
        return (
          <Select value={value} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger className={cn('text-right dir-rtl', error && 'border-red-500')}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      default:
        return (
          <Input
            {...baseProps}
            type={type}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label 
        htmlFor={fieldId} 
        className={cn(
          'text-right block',
          required && 'after:content-["*"] after:text-red-500 after:mr-1'
        )}
      >
        {label}
      </Label>
      
      <div className="relative">
        {renderInput()}
        
        {error && (
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-600 text-right flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
};

interface ArabicFormProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  className?: string;
  title?: string;
  description?: string;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
}

export const ArabicForm: React.FC<ArabicFormProps> = ({
  children,
  onSubmit,
  className,
  title,
  description,
  submitLabel = 'حفظ',
  cancelLabel = 'إلغاء',
  onCancel,
  isSubmitting = false,
  submitDisabled = false,
}) => {
  return (
    <form 
      onSubmit={onSubmit} 
      className={createArabicFormLayout(className)}
      dir="rtl"
    >
      {title && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-right mb-2">{title}</h2>
          {description && (
            <p className="text-gray-600 text-right text-sm">{description}</p>
          )}
        </div>
      )}
      
      <div className="space-y-4">
        {children}
      </div>
      
      <div className="flex gap-3 justify-start pt-6">
        <Button 
          type="submit" 
          disabled={isSubmitting || submitDisabled}
          className="flex items-center gap-2"
        >
          {isSubmitting && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          {submitLabel}
        </Button>
        
        {onCancel && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {cancelLabel}
          </Button>
        )}
      </div>
    </form>
  );
};

// Validation helpers for Arabic forms
export const arabicFormValidators = {
  required: (value: string) => {
    return value.trim() ? null : arabicValidationMessages.required;
  },
  
  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : arabicValidationMessages.email;
  },
  
  phone: (value: string) => {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,15}$/;
    return phoneRegex.test(value) ? null : arabicValidationMessages.phone;
  },
  
  minLength: (min: number) => (value: string) => {
    return value.length >= min ? null : arabicValidationMessages.minLength(min);
  },
  
  maxLength: (max: number) => (value: string) => {
    return value.length <= max ? null : arabicValidationMessages.maxLength(max);
  },
  
  numeric: (value: string) => {
    const numericRegex = /^[0-9]+$/;
    return numericRegex.test(value) ? null : arabicValidationMessages.numeric;
  },
  
  positiveNumber: (value: string) => {
    const num = parseFloat(value);
    return num > 0 ? null : arabicValidationMessages.positiveNumber;
  },
  
  range: (min: number, max: number) => (value: string) => {
    const num = parseFloat(value);
    return num >= min && num <= max ? null : arabicValidationMessages.range(min, max);
  },
};

// Hook for managing Arabic form state
export const useArabicForm = <T extends Record<string, any>>(
  initialValues: T,
  validators: Partial<Record<keyof T, (value: any) => string | null>>
) => {
  const [values, setValues] = React.useState<T>(initialValues);
  const [errors, setErrors] = React.useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = React.useState<Partial<Record<keyof T, boolean>>>({});

  const setValue = (name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const setTouched = (name: keyof T) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    
    Object.keys(validators).forEach(key => {
      const validator = validators[key as keyof T];
      if (validator) {
        const error = validator(values[key as keyof T]);
        if (error) {
          newErrors[key as keyof T] = error;
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    setValue,
    setTouched,
    validate,
    reset,
    isValid: Object.keys(errors).length === 0,
  };
}; 