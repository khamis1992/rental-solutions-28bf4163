import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { toast } from 'sonner';
import { useMaintenanceQuery } from '@/hooks/use-maintenance-query';
import { 
  Maintenance, 
  MaintenanceInsert, 
  MaintenanceUpdate, 
  MaintenanceCategory 
} from '@/types/maintenance.types';

// Add proper typing
interface MaintenanceFormProps {
  initialData?: Partial<Maintenance>;
  onSubmit?: (data: MaintenanceInsert | MaintenanceUpdate) => Promise<void>;
  categories?: MaintenanceCategory[];
  isSubmitting?: boolean;
  useExternalSubmit?: boolean;
  vehicleId?: string;
}

const MaintenanceForm: React.FC<MaintenanceFormProps> = ({ 
  initialData, 
  onSubmit, 
  categories = [],
  isSubmitting: externalIsSubmitting = false,
  useExternalSubmit = true,
  vehicleId
}) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Use React Query hooks
  const { 
    createMaintenance, 
    updateMaintenance 
  } = useMaintenanceQuery();
  
  // Set up mutations for create and update
  const createMaintenanceMutation = createMaintenance();
  const updateMaintenanceMutation = updateMaintenance();
  
  // Track submission state
  const isSubmitting = useExternalSubmit 
    ? externalIsSubmitting 
    : (createMaintenanceMutation.isPending || updateMaintenanceMutation.isPending);
  
  const form = useForm<MaintenanceInsert | MaintenanceUpdate>({
    defaultValues: {
      ...initialData || {
        vehicle_id: vehicleId || '',
        service_type: '',
        description: '',
        scheduled_date: new Date().toISOString(),
        cost: 0,
        notes: '',
        category_id: '',
        status: 'scheduled',
        priority: 'medium'
      }
    }
  });

  useEffect(() => {
    if (initialData?.category_id) {
      setSelectedCategory(initialData.category_id);
    }
  }, [initialData]);

  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(event.target.value);
    form.setValue('category_id', event.target.value);
  };

  const handleSubmit = async (data: MaintenanceInsert | MaintenanceUpdate) => {
    try {
      if (useExternalSubmit && onSubmit) {
        // Use external submit handler if provided
        await onSubmit(data);
      } else {
        // Use React Query mutations
        if (initialData?.id) {
          // Update existing record
          await updateMaintenanceMutation.mutateAsync({
            id: initialData.id,
            data: data as MaintenanceUpdate
          });
          toast.success('Maintenance record updated successfully');
        } else {
          // Create new record
          await createMaintenanceMutation.mutateAsync(data as MaintenanceInsert);
          toast.success('Maintenance record created successfully');
          form.reset();
        }
      }
    } catch (error) {
      toast.error('Failed to save maintenance record');
      console.error('Error in maintenance form:', error);
    }
  };
  // Safely filter categories
  const filteredCategories = Array.isArray(categories) 
    ? categories.filter(cat => cat?.is_active !== false)
    : [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Form fields go here */}
        <div className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : initialData?.id ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default MaintenanceForm;
