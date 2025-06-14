import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { LegalCaseFormValues } from './LegalCaseForm';

interface LegalCaseDescriptionProps {
  form: UseFormReturn<LegalCaseFormValues>;
}

export const LegalCaseDescription: React.FC<LegalCaseDescriptionProps> = ({ form }) => {
  return (
    <div dir="rtl">
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-right">الوصف</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="قدم تفاصيل حول القضية"
                className="min-h-[120px] text-right"
                dir="rtl"
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
