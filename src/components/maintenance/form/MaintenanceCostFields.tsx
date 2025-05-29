
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';

interface MaintenanceCostFieldsProps {
  form: UseFormReturn<any>;
}

export const MaintenanceCostFields: React.FC<MaintenanceCostFieldsProps> = ({ form }) => {
  return (
    <>
      <FormField
        control={form.control}
        name="cost"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Estimated Cost</FormLabel>
            <FormControl>
              <Input type="number" step="0.01" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="service_provider"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Service Provider</FormLabel>
            <FormControl>
              <Input placeholder="Service provider" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="invoice_number"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Invoice Number</FormLabel>
            <FormControl>
              <Input placeholder="Invoice number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="odometer_reading"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Odometer Reading</FormLabel>
            <FormControl>
              <Input type="number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};
