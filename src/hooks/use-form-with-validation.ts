
import { useState, useEffect } from 'react';
import { useForm, UseFormProps, UseFormReturn, FieldValues, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

/**
 * Options for the useFormWithValidation hook
 */
interface UseFormWithValidationOptions<TFormValues extends FieldValues> extends UseFormProps<TFormValues> {
  /**
   * Success message to show when the form is submitted successfully
   */
  successMessage?: string;
  
  /**
   * Error message to show when the form submission fails
   */
  errorMessage?: string;
  
  /**
   * Callback to execute after successful form submission
   */
  onSuccess?: (data: TFormValues) => void;
  
  /**
   * Callback to execute after form submission fails
   */
  onError?: (error: unknown) => void;
}

/**
 * Return type for the useFormWithValidation hook
 */
interface UseFormWithValidationReturn<TFormValues extends FieldValues> {
  /**
   * The form instance from React Hook Form
   */
  form: UseFormReturn<TFormValues>;
  
  /**
   * Whether the form is currently submitting
   */
  isSubmitting: boolean;
  
  /**
   * Function to handle form submission with error handling
   */
  handleSubmit: (data: TFormValues) => Promise<void>;
  
  /**
   * Function to reset the form with optional values
   */
  resetForm: (values?: TFormValues) => void;
  
  /**
   * Function to set a specific form field value
   */
  setFieldValue: <TFieldName extends Path<TFormValues>>(
    name: TFieldName,
    value: TFormValues[TFieldName]
  ) => void;
}

/**
 * Custom hook for form handling with Zod validation and standardized error handling
 * 
 * @param schema - Zod schema for form validation
 * @param submitFn - Function to call with form data on submission
 * @param options - Additional options for the form
 * @returns Form utilities and state
 * 
 * @example
 * ```tsx
 * const { form, isSubmitting, handleSubmit } = useFormWithValidation({
 *   schema: customerSchema,
 *   submitFn: createCustomer,
 *   options: {
 *     defaultValues: { status: 'active' },
 *     successMessage: 'Customer created successfully',
 *   }
 * });
 * 
 * return (
 *   <Form {...form}>
 *     <form onSubmit={form.handleSubmit(handleSubmit)}>
 *       {/* Form fields */}
 *     </form>
 *   </Form>
 * );
 * ```
 */
export function useFormWithValidation<TSchema extends z.ZodType<any, any, any>>(
  schema: TSchema,
  submitFn: (data: z.infer<TSchema>) => Promise<void> | void,
  options?: UseFormWithValidationOptions<z.infer<TSchema>>
): UseFormWithValidationReturn<z.infer<TSchema>> {
  type FormValues = z.infer<TSchema>;
  
  const {
    successMessage,
    errorMessage,
    onSuccess,
    onError,
    ...formOptions
  } = options || {};
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form with React Hook Form and Zod validation
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    ...formOptions,
  });
  
  // Handle form submission with error handling
  const handleSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      await submitFn(data);
      
      if (successMessage) {
        toast.success(successMessage);
      }
      
      if (onSuccess) {
        onSuccess(data);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      
      toast.error(
        errorMessage || 'An error occurred',
        { 
          description: error instanceof Error 
            ? error.message 
            : 'Please try again or contact support'
        }
      );
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Reset form with optional values
  const resetForm = (values?: FormValues) => {
    form.reset(values);
  };
  
  // Set a specific form field value
  const setFieldValue = <TFieldName extends Path<FormValues>>(
    name: TFieldName,
    value: FormValues[TFieldName]
  ) => {
    form.setValue(name, value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };
  
  return {
    form,
    isSubmitting,
    handleSubmit,
    resetForm,
    setFieldValue,
  };
}
