
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormProvider } from './FormProvider';

interface FormBuilderProps<T extends z.ZodType<any, any>> {
  schema: T;
  defaultValues: Partial<z.infer<T>>;
  onSubmit: (values: z.infer<T>) => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
  mode?: 'onBlur' | 'onChange' | 'onSubmit' | 'onTouched' | 'all';
}

export function FormBuilder<T extends z.ZodType<any, any>>({
  schema,
  defaultValues,
  onSubmit,
  children,
  className,
  mode = 'onSubmit'
}: FormBuilderProps<T>) {
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as z.infer<T>,
    mode,
  });

  return (
    <FormProvider<T> 
      form={form} 
      onSubmit={onSubmit} 
      className={className}
    >
      {children}
    </FormProvider>
  );
}

