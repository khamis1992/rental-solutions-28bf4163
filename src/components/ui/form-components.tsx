
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormRowProps {
  children: React.ReactNode;
  className?: string;
}

export const FormRow = ({ children, className }: FormRowProps) => (
  <div className={cn("space-y-2 mb-4", className)}>
    {children}
  </div>
);

interface FormGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const FormGroup = ({ children, className }: FormGroupProps) => (
  <div className={cn("grid gap-4", className)}>
    {children}
  </div>
);

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export const FormField = ({
  label,
  htmlFor,
  error,
  className,
  children
}: FormFieldProps) => (
  <div className={cn("space-y-2", className)}>
    <Label htmlFor={htmlFor}>{label}</Label>
    {children}
    {error && (
      <p className="text-sm text-red-500">{error}</p>
    )}
  </div>
);

interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormSection = ({
  title,
  description,
  children,
  className
}: FormSectionProps) => (
  <div className={cn("space-y-4", className)}>
    {(title || description) && (
      <div className="space-y-1">
        {title && <h3 className="text-lg font-medium">{title}</h3>}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    )}
    {children}
  </div>
);
