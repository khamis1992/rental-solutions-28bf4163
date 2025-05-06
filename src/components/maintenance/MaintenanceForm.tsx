import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { toast } from 'sonner';
import { typeGuards } from '@/lib/database';

// Add missing types
interface MaintenanceFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  categories?: any[];
  isSubmitting?: boolean;
}

const MaintenanceForm: React.FC<MaintenanceFormProps> = ({ 
  initialData, 
  onSubmit, 
  categories = [],
  isSubmitting = false
}) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const form = useForm({
    defaultValues: {
      ...initialData || {
        vehicle_id: '',
        service_type: '',
        description: '',
        scheduled_date: new Date(),
        cost: 0,
        notes: '',
        category_id: ''
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

  const handleSubmit = async (data: any) => {
    try {
      await onSubmit(data);
    } catch (error) {
      toast.error('Failed to save maintenance record');
      console.error('Error in maintenance form:', error);
    }
  };

  // Safely filter categories
  const filteredCategories = typeGuards.isArray(categories) 
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
