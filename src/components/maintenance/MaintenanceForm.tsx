
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useMaintenance } from '@/hooks/use-maintenance';
import { useVehicles } from '@/hooks/use-vehicles';
import { Loader2 } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const maintenanceFormSchema = z.object({
  vehicle_id: z.string().min(1, { message: 'Vehicle is required' }),
  maintenance_type: z.string().min(1, { message: 'Maintenance type is required' }),
  description: z.string().min(3, { message: 'Description is required' }),
  scheduled_date: z.string().min(1, { message: 'Scheduled date is required' }),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']),
  cost: z.coerce.number().min(0, { message: 'Cost must be a non-negative number' }),
  notes: z.string().optional(),
  assigned_to: z.string().optional(),
});

export type MaintenanceFormValues = z.infer<typeof maintenanceFormSchema>;

interface MaintenanceFormProps {
  initialValues?: Partial<MaintenanceFormValues>;
  onSubmit: (values: MaintenanceFormValues) => void;
  isSubmitting: boolean;
}

export function MaintenanceForm({ initialValues, onSubmit, isSubmitting }: MaintenanceFormProps) {
  const { vehicles } = useVehicles();
  
  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceFormSchema),
    defaultValues: {
      vehicle_id: initialValues?.vehicle_id || '',
      maintenance_type: initialValues?.maintenance_type || 'REGULAR_INSPECTION',
      description: initialValues?.description || '',
      scheduled_date: initialValues?.scheduled_date || new Date().toISOString(),
      status: initialValues?.status || 'scheduled',
      cost: initialValues?.cost || 0,
      notes: initialValues?.notes || '',
      assigned_to: initialValues?.assigned_to || '',
    },
  });

  // Update form when initialValues change
  useEffect(() => {
    if (initialValues) {
      form.reset({
        vehicle_id: initialValues.vehicle_id || '',
        maintenance_type: initialValues.maintenance_type || 'REGULAR_INSPECTION',
        description: initialValues.description || '',
        scheduled_date: initialValues.scheduled_date || new Date().toISOString(),
        status: initialValues.status || 'scheduled',
        cost: initialValues.cost || 0,
        notes: initialValues.notes || '',
        assigned_to: initialValues.assigned_to || '',
      });
    }
  }, [initialValues, form]);

  const availableVehicles = Array.isArray(vehicles) 
    ? vehicles 
    : [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="vehicle_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vehicle</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vehicle" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableVehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="maintenance_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maintenance Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select maintenance type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="REGULAR_INSPECTION">Regular Inspection</SelectItem>
                  <SelectItem value="OIL_CHANGE">Oil Change</SelectItem>
                  <SelectItem value="TIRE_REPLACEMENT">Tire Replacement</SelectItem>
                  <SelectItem value="BRAKE_SERVICE">Brake Service</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Description of maintenance" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scheduled_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Scheduled Date</FormLabel>
              <DatePicker
                date={field.value ? new Date(field.value) : undefined}
                setDate={(date) => field.onChange(date ? date.toISOString() : "")}
              />
              <FormDescription>When should this maintenance be performed?</FormDescription>
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
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cost</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormDescription>Cost of the maintenance</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Additional notes" {...field} />
              </FormControl>
              <FormDescription>Any additional information</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="assigned_to"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assigned To</FormLabel>
              <FormControl>
                <Input placeholder="Technician name" {...field} />
              </FormControl>
              <FormDescription>Who will perform this maintenance?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Maintenance"
          )}
        </Button>
      </form>
    </Form>
  );
}

export default MaintenanceForm;
