import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';

interface MaintenanceDateFieldsProps {
  form: UseFormReturn<any>;
}

export const MaintenanceDateFields: React.FC<MaintenanceDateFieldsProps> = ({ form }) => {
  return (
    <div dir="rtl" className="space-y-4">
      <FormField
        control={form.control}
        name="scheduled_date"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-right">
              التاريخ المجدول
            </FormLabel>
            <FormControl>
              <Input 
                type="date" 
                {...field} 
                className="text-right"
                dir="rtl"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="completed_date"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-right">
              تاريخ الإنجاز
            </FormLabel>
            <FormControl>
              <Input 
                type="date" 
                {...field} 
                className="text-right"
                dir="rtl"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
