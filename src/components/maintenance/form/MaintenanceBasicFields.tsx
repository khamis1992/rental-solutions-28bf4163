import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';

interface MaintenanceBasicFieldsProps {
  form: UseFormReturn<any>;
}

export const MaintenanceBasicFields: React.FC<MaintenanceBasicFieldsProps> = ({ form }) => {
  const vehicleId = form.watch('vehicle_id');
  const agreementId = form.watch('agreement_id');

  return (
    <>
      {(vehicleId || agreementId) && (
        <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded">
          <div className="text-sm text-blue-900 font-medium">Prefilled Context:</div>
          {vehicleId && <div className="text-xs text-blue-800">Vehicle ID: <span className="font-mono">{vehicleId}</span></div>}
          {agreementId && <div className="text-xs text-blue-800">Agreement ID: <span className="font-mono">{agreementId}</span></div>}
        </div>
      )}
      <FormField
        control={form.control}
        name="vehicle_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Vehicle ID</FormLabel>
            <FormControl>
              <Input placeholder="Vehicle ID" {...field} readOnly={!!field.value} />
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
              <Input placeholder="Agreement ID" {...field} readOnly={!!field.value} />
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
