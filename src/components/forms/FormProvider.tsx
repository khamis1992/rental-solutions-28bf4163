
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/components/ui/use-toast';
import { Form } from '@/components/ui/form';

interface FormProviderProps<T extends z.ZodType<any, any>> {
  form: UseFormReturn<z.infer<T>>;
  onSubmit: (values: z.infer<T>) => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
}

export function FormProvider<T extends z.ZodType<any, any>>({
  form,
  onSubmit,
  children,
  className = ''
}: FormProviderProps<T>) {
  const { toast } = useToast();

  const handleSubmit = async (values: z.infer<T>) => {
    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred while submitting the form.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={className}>
        {children}
      </form>
    </Form>
  );
}
