
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { 
  Form,
  FormControl,
  FormField,
  FormItem, 
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTemplateSetup } from '@/hooks/form/useTemplateSetup';
import { AgreementTemplateStatus } from './AgreementTemplateStatus';
import { Agreement } from '@/types/agreement';

interface AddAgreementFormProps {
  initialData?: Partial<Agreement>;
  onSubmit: (data: any) => Promise<void> | void;
  isSubmitting?: boolean;
}

export function AddAgreementForm({ initialData, onSubmit, isSubmitting = false }: AddAgreementFormProps) {
  const form = useForm({
    defaultValues: initialData || {}
  });
  const { register, handleSubmit, formState: { errors }, setValue } = form;
  
  const { standardTemplateExists, specificUrlCheck } = useTemplateSetup();
  
  const [isLoading, setIsLoading] = useState(false);
  
  const handleFormSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('خطأ في إرسال النموذج:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (initialData) {
      Object.entries(initialData).forEach(([key, value]) => {
        setValue(key as any, value);
      });
    }
  }, [initialData, setValue]);
  
  return (
    <Form {...form}>
      <AgreementTemplateStatus 
        standardTemplateExists={Boolean(standardTemplateExists?.accessible)} 
        specificUrlCheck={Boolean(specificUrlCheck?.accessible)}
      />
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="agreement_number" className="block text-sm font-medium text-right">
              رقم الاتفاقية
            </label>
            <Input 
              id="agreement_number"
              placeholder="AGR-XXXXXX (سيتم التوليد تلقائياً إذا ترك فارغاً)"
              className="text-right"
              dir="rtl"
              {...register('agreement_number')}
            />
            {errors.agreement_number && (
              <p className="text-sm text-red-500 text-right">{errors.agreement_number.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="customer_id" className="block text-sm font-medium text-right">
              العميل
            </label>
            <Input 
              id="customer_id"
              placeholder="اختر عميلاً"
              className="text-right"
              dir="rtl"
              {...register('customer_id', { required: 'العميل مطلوب' })}
            />
            {errors.customer_id && (
              <p className="text-sm text-red-500 text-right">{errors.customer_id.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="vehicle_id" className="block text-sm font-medium text-right">
              المركبة
            </label>
            <Input 
              id="vehicle_id"
              placeholder="اختر مركبة"
              className="text-right"
              dir="rtl"
              {...register('vehicle_id', { required: 'المركبة مطلوبة' })}
            />
            {errors.vehicle_id && (
              <p className="text-sm text-red-500 text-right">{errors.vehicle_id.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="total_amount" className="block text-sm font-medium text-right">
              المبلغ الإجمالي
            </label>
            <Input 
              id="total_amount"
              type="number"
              placeholder="0.00"
              className="text-right"
              dir="rtl"
              {...register('rent_amount', { required: 'المبلغ مطلوب' })}
            />
            {errors.rent_amount && (
              <p className="text-sm text-red-500 text-right">{errors.rent_amount.message}</p>
            )}
          </div>
        </div>
        
        <div className="flex justify-start">
          <Button type="submit" disabled={isLoading || isSubmitting}>
            {isLoading || isSubmitting ? 'جاري الإنشاء...' : 'إنشاء الاتفاقية'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default AddAgreementForm;
