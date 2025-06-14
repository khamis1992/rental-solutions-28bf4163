
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { MaintenanceType, MaintenanceStatus } from '@/lib/validation-schemas/maintenance';
import { typeGuards } from '@/lib/database';

interface MaintenanceTypeFieldsProps {
  form: UseFormReturn<any>;
  categories?: any[];
}

export const MaintenanceTypeFields: React.FC<MaintenanceTypeFieldsProps> = ({ 
  form, 
  categories = [] 
}) => {
  // Safely filter categories
  const filteredCategories = typeGuards.isArray(categories) 
    ? categories.filter(cat => cat?.is_active !== false)
    : [];

  return (
    <>
      <FormField
        control={form.control}
        name="maintenance_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Maintenance Type</FormLabel>
            <FormControl>
              <Select
                onValueChange={(value) =>
                  field.onChange(value === 'none' ? '' : value)
                }
                value={field.value}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(MaintenanceType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Status</FormLabel>
            <FormControl>
              <Select
                onValueChange={(value) =>
                  field.onChange(value === 'none' ? '' : value)
                }
                value={field.value}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(MaintenanceStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="category_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Category</FormLabel>
            <FormControl>
              <Select
                onValueChange={(value) =>
                  field.onChange(value === 'none' ? '' : value)
                }
                value={field.value}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {filteredCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};
