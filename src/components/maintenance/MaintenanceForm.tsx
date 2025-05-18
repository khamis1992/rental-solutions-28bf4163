import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const form = useForm({
    defaultValues: {
      ...initialData || {
        vehicle_id: '',
        service_type: '',
        description: '',
        scheduled_date: new Date().toISOString().split('T')[0],
        cost: 0,
        notes: '',
        category_id: ''
      }
    }
  });

  useEffect(() => {
    if (initialData?.category_id) {
      form.setValue('category_id', initialData.category_id);
    }
  }, [initialData, form]);

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
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

          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Describe the maintenance" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Additional notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

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
