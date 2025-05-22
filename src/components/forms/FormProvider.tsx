
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/components/ui/use-toast';
import { Form } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface FormProviderProps<T extends z.ZodType<any, any>> {
  form: UseFormReturn<z.infer<T>>;
  onSubmit: (values: z.infer<T>) => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
  showFormLevelErrors?: boolean;
}

export function FormProvider<T extends z.ZodType<any, any>>({
  form,
  onSubmit,
  children,
  className = '',
  showFormLevelErrors = true
}: FormProviderProps<T>) {
  const { toast } = useToast();
  const formErrors = form.formState.errors;
  const formErrorMessages = Object.values(formErrors)
    .map(error => error?.message ? String(error.message) : null)
    .filter(Boolean);

  const handleSubmit = async (values: z.infer<T>) => {
    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
      
      let errorMessage = 'An error occurred while submitting the form.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String((error as any).message);
      }
      
      toast({
        title: 'Form Submission Error',
        description: errorMessage,
        variant: 'destructive',
        action: {
          label: 'Try again',
          onClick: () => form.handleSubmit(handleSubmit)(),
        },
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={className}>
        {showFormLevelErrors && formErrorMessages.length > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please fix the following errors:
              <ul className="mt-2 ml-2 list-disc list-inside">
                {formErrorMessages.map((message, index) => (
                  <li key={index}>{message}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        {children}
      </form>
    </Form>
  );
}

