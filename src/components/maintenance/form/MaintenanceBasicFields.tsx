
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';

interface MaintenanceBasicFieldsProps {
  form: UseFormReturn<any>;
}

export const MaintenanceBasicFields: React.FC<MaintenanceBasicFieldsProps> = ({ form }) => {
  return (
    <>
      <FormField
        control={form.control}
        name="vehicle_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Vehicle ID</FormLabel>
            <FormControl>
              <Input placeholder="Vehicle ID" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="agreement_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Agreement ID</FormLabel>
            <FormControl>
              <Input placeholder="Agreement ID" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="service_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Service Type</FormLabel>
            <FormControl>
              <Input placeholder="Service type" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};
