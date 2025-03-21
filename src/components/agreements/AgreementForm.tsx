
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { useAgreements } from '@/hooks/use-agreements';
import { useCustomers } from '@/hooks/use-customers';
import { useVehicles } from '@/hooks/use-vehicles';
import { Agreement, AgreementStatus, AgreementFormData } from '@/types/agreement';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { CustomButton } from '@/components/ui/custom-button';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// Schema for form validation
const agreementSchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  vehicle_id: z.string().min(1, 'Vehicle is required'),
  start_date: z.date({ required_error: 'Start date is required' }),
  end_date: z.date({ required_error: 'End date is required' }),
  status: z.enum(['active', 'pending', 'completed', 'cancelled', 'overdue'] as const, {
    required_error: 'Status is required',
  }),
  total_cost: z.coerce.number().min(0, 'Total cost must be at least 0'),
  deposit_amount: z.coerce.number().min(0, 'Deposit amount must be at least 0').optional(),
  notes: z.string().optional(),
}).refine(data => data.end_date >= data.start_date, {
  message: 'End date must be after start date',
  path: ['end_date'],
});

type AgreementFormSchema = z.infer<typeof agreementSchema>;

interface AgreementFormProps {
  initialData?: Partial<Agreement>;
  isEditMode?: boolean;
}

const AgreementForm: React.FC<AgreementFormProps> = ({
  initialData,
  isEditMode = false,
}) => {
  const navigate = useNavigate();
  const [vehicleDailyRate, setVehicleDailyRate] = useState<number>(0);
  
  // Custom hooks for data and mutations
  const { useCreate, useUpdate } = useAgreements();
  const { useGetCustomers } = useCustomers();
  const { useList: useVehicleList } = useVehicles();
  
  const { data: customers, isLoading: isLoadingCustomers } = useGetCustomers();
  const { data: vehicles, isLoading: isLoadingVehicles } = useVehicleList({ status: 'available' });
  
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  
  const isLoading = createMutation.isPending || updateMutation.isPending;
  
  // Setup form with validation
  const form = useForm<AgreementFormSchema>({
    resolver: zodResolver(agreementSchema),
    defaultValues: {
      customer_id: initialData?.customer_id || '',
      vehicle_id: initialData?.vehicle_id || '',
      start_date: initialData?.start_date ? new Date(initialData.start_date) : new Date(),
      end_date: initialData?.end_date ? new Date(initialData.end_date) : new Date(),
      status: (initialData?.status as AgreementStatus) || 'pending',
      total_cost: initialData?.total_cost || 0,
      deposit_amount: initialData?.deposit_amount || 0,
      notes: initialData?.notes || '',
    },
  });
  
  // Watch form values to calculate total
  const { start_date, end_date, vehicle_id } = form.watch();
  
  // Find the selected vehicle and get its daily rate
  useEffect(() => {
    if (vehicle_id && vehicles) {
      const selectedVehicle = vehicles.find(v => v.id === vehicle_id);
      if (selectedVehicle) {
        setVehicleDailyRate(selectedVehicle.dailyRate || selectedVehicle.rent_amount || 0);
      }
    }
  }, [vehicle_id, vehicles]);
  
  // Calculate rental days and total
  useEffect(() => {
    if (start_date && end_date) {
      // Calculate number of days between dates
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; // Minimum 1 day
      
      // Calculate total cost
      const totalCost = diffDays * vehicleDailyRate;
      form.setValue('total_cost', totalCost);
    }
  }, [start_date, end_date, vehicleDailyRate, form]);
  
  const onSubmit = async (data: AgreementFormSchema) => {
    try {
      // Prepare data for API
      const formData: AgreementFormData = {
        ...data,
        start_date: format(data.start_date, 'yyyy-MM-dd'),
        end_date: format(data.end_date, 'yyyy-MM-dd'),
      };
      
      if (isEditMode && initialData?.id) {
        await updateMutation.mutateAsync({ 
          id: initialData.id, 
          data: formData 
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
      
      // On success, navigate back to agreements list
      navigate('/agreements');
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };
  
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit Rental Agreement' : 'New Rental Agreement'}</CardTitle>
      </CardHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Selection */}
              <FormField
                control={form.control}
                name="customer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select 
                      disabled={isLoading || isEditMode}
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingCustomers ? (
                          <SelectItem value="loading" disabled>Loading customers...</SelectItem>
                        ) : customers?.length ? (
                          customers.map(customer => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.first_name} {customer.last_name} ({customer.email})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>No customers available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Vehicle Selection */}
              <FormField
                control={form.control}
                name="vehicle_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle</FormLabel>
                    <Select 
                      disabled={isLoading || isEditMode}
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingVehicles ? (
                          <SelectItem value="loading" disabled>Loading vehicles...</SelectItem>
                        ) : vehicles?.length ? (
                          vehicles.map(vehicle => (
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                              {vehicle.make} {vehicle.model} ({vehicle.licensePlate || vehicle.license_plate}) - ${vehicle.dailyRate || vehicle.rent_amount}/day
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>No available vehicles</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Start Date */}
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* End Date */}
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => 
                            date < (start_date || new Date(new Date().setHours(0, 0, 0, 0)))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Status */}
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
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Total Cost */}
              <FormField
                control={form.control}
                name="total_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Cost ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Deposit Amount */}
              <FormField
                control={form.control}
                name="deposit_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deposit Amount ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional information about the rental agreement" 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/agreements')}
            >
              Cancel
            </Button>
            
            <CustomButton type="submit" disabled={isLoading} glossy>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Update Agreement' : 'Create Agreement'}
            </CustomButton>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default AgreementForm;
