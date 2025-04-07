
import React from 'react';
import { useFormContext, Controller, Path, FieldValues, FieldError } from 'react-hook-form';
import { FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

interface FormFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  required?: boolean;
  children: React.ReactElement;
  description?: string;
}

export function FormField<T extends FieldValues>({ 
  name, 
  label, 
  required = false, 
  children, 
  description 
}: FormFieldProps<T>) {
  const { control, formState } = useFormContext<T>();
  const error = formState.errors[name] as FieldError | undefined;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <FormControl>
            {React.cloneElement(children, { 
              ...field,
              id: name,
              'aria-invalid': error ? 'true' : 'false',
              'aria-describedby': error ? `${name}-error` : undefined,
              ...children.props 
            })}
          </FormControl>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
          <FormMessage id={`${name}-error`} />
        </FormItem>
      )}
    />
  );
}
