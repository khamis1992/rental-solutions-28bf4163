
import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { MaintenanceStatus, MaintenanceType } from '@/lib/validation-schemas/maintenance';
import { Card, CardContent } from '@/components/ui/card';
import VehicleSelector from '@/components/vehicles/VehicleSelector';
import { MaintenanceRecord } from '@/types/maintenance';
import { Skeleton } from '@/components/ui/skeleton';
import { useVehicles } from '@/hooks/use-vehicles';

// Define the form schema
const maintenanceFormSchema = z.object({
  maintenance_type: z.string().min(1, {
    message: "Please select a maintenance type",
  }),
  service_type: z.string().optional(),
  description: z.string().optional(),
  vehicle_id: z.string().nullable().optional(),
  scheduled_date: z.string().min(1, {
    message: "Please select a scheduled date",
  }),
  completion_date: z.string().optional(),
  status: z.string().min(1, {
    message: "Please select a status",
  }),
  cost: z.number().optional(),
  service_provider: z.string().optional(),
  notes: z.string().optional(),
  category_id: z.string().optional(),
});

export type MaintenanceFormProps = {
  initialData?: MaintenanceRecord;
  onSubmit: (formData: any) => void;
};

const MaintenanceForm: React.FC<MaintenanceFormProps> = ({
  initialData,
  onSubmit,
}) => {
  const { vehicles, isLoading: loadingVehicles } = useVehicles();
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await fetch('/api/maintenance-categories').then(res => res.json());
        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Set up the form
  const form = useForm<z.infer<typeof maintenanceFormSchema>>({
    resolver: zodResolver(maintenanceFormSchema),
    defaultValues: {
      maintenance_type: initialData?.maintenance_type || '',
      service_type: initialData?.service_type || '',
      description: initialData?.description || '',
      vehicle_id: initialData?.vehicle_id || null,
      scheduled_date: initialData?.scheduled_date 
        ? typeof initialData.scheduled_date === 'string' 
          ? initialData.scheduled_date.split('T')[0] 
          : (initialData.scheduled_date as Date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      completion_date: initialData?.completion_date 
        ? typeof initialData.completion_date === 'string'
          ? initialData.completion_date.split('T')[0]
          : (initialData.completion_date as Date)?.toISOString().split('T')[0]
        : '',
      status: initialData?.status || MaintenanceStatus.SCHEDULED,
      cost: initialData?.cost || 0,
      service_provider: initialData?.service_provider || '',
      notes: initialData?.notes || '',
      category_id: initialData?.category_id || '',
    },
  });

  useEffect(() => {
    if (initialData?.vehicle_id && vehicles.length) {
      const vehicle = vehicles.find(v => v.id === initialData.vehicle_id);
      if (vehicle) {
        setSelectedVehicle(vehicle);
      }
    }
  }, [initialData?.vehicle_id, vehicles]);

  const handleFormSubmit = (values: z.infer<typeof maintenanceFormSchema>) => {
    onSubmit({
      ...values,
      vehicle_id: selectedVehicle?.id || values.vehicle_id,
    });
  };

  const handleVehicleSelect = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    form.setValue('vehicle_id', vehicle.id);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="maintenance_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maintenance Type</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a maintenance type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(MaintenanceType).map(([key, value]) => (
                      <SelectItem key={key} value={value}>
                        {key.replace(/_/g, ' ')}
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
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(MaintenanceStatus).map(([key, value]) => (
                      <SelectItem key={key} value={value}>
                        {key.replace(/_/g, ' ')}
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
            name="completion_date"
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

          <FormField
            control={form.control}
            name="cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    {...field} 
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
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
                  <Input {...field} />
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
                {loadingCategories ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormLabel>Vehicle</FormLabel>
          {loadingVehicles ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <VehicleSelector
              selectedVehicle={selectedVehicle}
              onVehicleSelect={handleVehicleSelect}
              placeholder="Select a vehicle"
            />
          )}
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the maintenance task"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
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
                <Textarea
                  placeholder="Additional notes"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button 
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Saving...' : (initialData ? 'Update' : 'Create')}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default MaintenanceForm;
