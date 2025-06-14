
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';

interface MaintenanceDateFieldsProps {
  form: UseFormReturn<any>;
}

export const MaintenanceDateFields: React.FC<MaintenanceDateFieldsProps> = ({ form }) => {
  return (
    <>
      <FormField
        control={form.control}
        name="scheduled_date"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Scheduled Date</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
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
            <FormLabel>Completion Date</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};
