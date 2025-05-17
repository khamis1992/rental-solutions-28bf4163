import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Form,
  FormControl,
  FormField,
  FormItem, 
  FormLabel,
  FormMessage 
} from '@/components/ui/form';
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="agreement_number" className="block text-sm font-medium">
              Agreement Number
            </label>
            <Input 
              id="agreement_number"
              placeholder="AGR-XXXXXX (Will be auto-generated if empty)"
              {...register('agreement_number')}
            />
            {errors.agreement_number && (
              <p className="text-sm text-red-500">{errors.agreement_number.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="customer_id" className="block text-sm font-medium">
              Customer
            </label>
            <Input 
              id="customer_id"
              placeholder="Select a customer"
              {...register('customer_id', { required: 'Customer is required' })}
            />
            {errors.customer_id && (
              <p className="text-sm text-red-500">{errors.customer_id.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="vehicle_id" className="block text-sm font-medium">
              Vehicle
            </label>
            <Input 
              id="vehicle_id"
              placeholder="Select a vehicle"
              {...register('vehicle_id', { required: 'Vehicle is required' })}
            />
            {errors.vehicle_id && (
              <p className="text-sm text-red-500">{errors.vehicle_id.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="total_amount" className="block text-sm font-medium">
              Total Amount
            </label>
            <Input 
              id="total_amount"
              type="number"
              placeholder="0.00"
              {...register('total_amount', { required: 'Amount is required' })}
            />
            {errors.total_amount && (
              <p className="text-sm text-red-500">{errors.total_amount.message}</p>
            )}
          </div>
        </div>
        
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
