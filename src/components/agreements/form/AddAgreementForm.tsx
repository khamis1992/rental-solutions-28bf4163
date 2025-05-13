import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTemplateSetup } from './TemplateSetup';
import { AgreementTemplateStatus } from './AgreementTemplateStatus';
import { Agreement } from '@/types/agreement';

interface AddAgreementFormProps {
  initialData?: Partial<Agreement>;
  onSubmit: (data: any) => Promise<void> | void;
  isSubmitting?: boolean;
}

export function AddAgreementForm({ initialData, onSubmit, isSubmitting = false }: AddAgreementFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData || {}
  });
  
  // Use template setup hook to check for available templates
  const { standardTemplateExists, specificUrlCheck, templateError } = useTemplateSetup();
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Show error if template check fails
  useEffect(() => {
    if (templateError) {
      console.error("Template error:", templateError);
    }
  }, [templateError]);
  
  const handleFormSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      await onSubmit(data);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <AgreementTemplateStatus 
        standardTemplateExists={standardTemplateExists} 
        specificUrlCheck={specificUrlCheck} 
      />
      
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Form fields would go here */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading || isSubmitting}>
            {isLoading || isSubmitting ? 'Creating...' : 'Create Agreement'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default AddAgreementForm;
