import React, { useState, useEffect } from 'react';
import { MaintenanceRecord, MaintenanceCategory } from '@/types/maintenance';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { maintenanceSchema } from '@/lib/validation-schemas/maintenance';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface MaintenanceFormProps {
  initialData?: Partial<MaintenanceRecord>;
  onSubmit: (data: any) => void;
  isEditMode?: boolean;
}

const MaintenanceForm: React.FC<MaintenanceFormProps> = ({
  initialData,
  onSubmit,
  isEditMode = false,
}) => {
  const [categories, setCategories] = useState<MaintenanceCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Setup form with validation
  const form = useForm<MaintenanceRecord>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      ...initialData || {
        maintenance_type: 'REGULAR_INSPECTION',
        description: '',
        cost: 0,
        scheduled_date: new Date().toISOString(),
        completion_date: undefined,
        status: 'scheduled',
        service_provider: '',
        vehicle_id: '',
        notes: '',
      }
    }
  });

  // Load maintenance categories
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        // Mocked categories for now - in a real app, this would come from an API
        const mockCategories = [
          { id: '1', name: 'Engine', description: 'Engine maintenance', is_active: true },
          { id: '2', name: 'Brakes', description: 'Brake system', is_active: true },
          { id: '3', name: 'Tires', description: 'Tire maintenance', is_active: true },
          { id: '4', name: 'Electrical', description: 'Electrical system', is_active: true },
          { id: '5', name: 'Interior', description: 'Interior maintenance', is_active: true },
        ];
        setCategories(mockCategories as MaintenanceCategory[]);
      } catch (error) {
        console.error('Error loading maintenance categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Handle form submission
  const handleSubmit = (data: MaintenanceRecord) => {
    onSubmit(data);
  };

  const activeCategories = categories.filter(category => 
    // Type guard to check if the category has is_active property
    (category && typeof category === 'object' && 'is_active' in category) 
      ? category.is_active 
      : true
  );

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
