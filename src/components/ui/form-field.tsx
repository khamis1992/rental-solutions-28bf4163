import React from 'react';
import { useFormContext, Controller, Path, FieldValues, ControllerRenderProps } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

/**
 * Option type for select fields
 */
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * Props for the StandardFormField component
 */
export interface StandardFormFieldProps<TFieldValues extends FieldValues> {
  /**
   * Name of the form field
   */
  name: Path<TFieldValues>;
  
  /**
   * Label for the form field
   */
  label?: string;
  
  /**
   * Description for the form field
   */
  description?: string;
  
  /**
   * Type of the form field
   */
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'switch';
  
  /**
   * Placeholder for the form field
   */
  placeholder?: string;
  
  /**
   * Whether the form field is required
   */
  required?: boolean;
  
  /**
   * Whether the form field is disabled
   */
  disabled?: boolean;
  
  /**
   * Options for select fields
   */
  options?: SelectOption[];
  
  /**
   * Additional className for the form field
   */
  className?: string;
  
  /**
   * Custom render function for the form field
   */
  renderField?: (field: ControllerRenderProps<TFieldValues, Path<TFieldValues>>) => React.ReactNode;
}

/**
 * Standardized form field component that works with React Hook Form
 * Supports various field types with consistent styling and error handling
 */
export function StandardFormField<TFieldValues extends FieldValues>({
  name,
  label,
  description,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  options = [],
  className,
  renderField,
}: StandardFormFieldProps<TFieldValues>) {
  const formContext = useFormContext<TFieldValues>();
  
  if (!formContext) {
    console.error('StandardFormField must be used within a FormProvider');
    return null;
  }
  
  return (
    <FormField
      control={formContext.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel className={cn(required && 'after:content-["*"] after:ml-0.5 after:text-red-500')}>
              {label}
            </FormLabel>
          )}
          
          <FormControl>
            {renderField ? (
              renderField(field)
            ) : (
              <>
                {type === 'text' && (
                  <Input
                    {...field}
                    value={field.value || ''}
                    type="text"
                    placeholder={placeholder}
                    disabled={disabled}
                  />
                )}
                
                {type === 'email' && (
                  <Input
                    {...field}
                    value={field.value || ''}
                    type="email"
                    placeholder={placeholder}
                    disabled={disabled}
                  />
                )}
                
                {type === 'password' && (
                  <Input
                    {...field}
                    value={field.value || ''}
                    type="password"
                    placeholder={placeholder}
                    disabled={disabled}
                  />
                )}
                
                {type === 'number' && (
                  <Input
                    {...field}
                    value={field.value || ''}
                    type="number"
                    placeholder={placeholder}
                    disabled={disabled}
                    onChange={(e) => {
                      const value = e.target.value === '' ? '' : Number(e.target.value);
                      field.onChange(value);
                    }}
                  />
                )}
                
                {type === 'textarea' && (
                  <Textarea
                    {...field}
                    value={field.value || ''}
                    placeholder={placeholder}
                    disabled={disabled}
                  />
                )}
                
                {type === 'select' && (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={disabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          disabled={option.disabled}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                
                {type === 'checkbox' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={disabled}
                      id={`checkbox-${name}`}
                    />
                    {placeholder && (
                      <label
                        htmlFor={`checkbox-${name}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {placeholder}
                      </label>
                    )}
                  </div>
                )}
                
                {type === 'switch' && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={disabled}
                      id={`switch-${name}`}
                    />
                    {placeholder && (
                      <label
                        htmlFor={`switch-${name}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {placeholder}
                      </label>
                    )}
                  </div>
                )}
              </>
            )}
          </FormControl>
          
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
