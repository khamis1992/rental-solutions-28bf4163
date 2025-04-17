import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { useVehicles } from '@/hooks/use-vehicles';

export interface MaintenanceFormProps {
  onSubmit: (formData: any) => void;
  isLoading?: boolean;
  initialData?: any;
  isEditMode?: boolean;
}

const maintenanceSchema = z.object({
  vehicle_id: z.string().min(1, { message: "Vehicle is required" }),
  service_date: z.date({
    required_error: "Service date is required",
  }),
  service_type: z.string().min(1, { message: "Service type is required" }),
  description: z.string().optional(),
  cost: z.number().min(0, { message: "Cost must be a positive number" }).optional(),
  odometer: z.number().min(0, { message: "Odometer reading must be a positive number" }).optional(),
  performed_by: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().default("scheduled"),
});

const MaintenanceForm: React.FC<MaintenanceFormProps> = ({
  onSubmit,
  isLoading = false,
  initialData,
  isEditMode = false
}) => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const { vehicles: allVehicles, isLoading: vehiclesLoading } = useVehicles();
  
  const form = useForm({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: initialData || {
      vehicle_id: '',
      service_date: new Date(),
      service_type: '',
      description: '',
      cost: 0,
      odometer: 0,
      performed_by: '',
      notes: '',
      status: 'scheduled',
    }
  });

  useEffect(() => {
    if (allVehicles) {
      setVehicles(allVehicles);
    }
  }, [allVehicles]);

  const handleSubmit = (data: any) => {
    onSubmit(data);
  };

  const serviceTypes = [
    { id: 'oil_change', name: 'Oil Change' },
    { id: 'tire_rotation', name: 'Tire Rotation' },
    { id: 'brake_service', name: 'Brake Service' },
    { id: 'engine_repair', name: 'Engine Repair' },
    { id: 'transmission', name: 'Transmission Service' },
    { id: 'inspection', name: 'General Inspection' },
    { id: 'battery', name: 'Battery Replacement' },
    { id: 'other', name: 'Other' },
  ];

  const statuses = [
    { id: 'scheduled', name: 'Scheduled' },
    { id: 'in_progress', name: 'In Progress' },
    { id: 'completed', name: 'Completed' },
    { id: 'cancelled', name: 'Cancelled' },
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vehicle Selection */}
              <FormField
                control={form.control}
                name="vehicle_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={vehiclesLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
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
              
              {/* Service Date */}
              <FormField
                control={form.control}
                name="service_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Service Date</FormLabel>
                    <DatePicker
                      date={field.value}
                      onSelect={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Service Type */}
              <FormField
                control={form.control}
                name="service_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select service type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {serviceTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Cost */}
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter cost" 
                        {...field} 
                        value={field.value || ''}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Odometer */}
              <FormField
                control={form.control}
                name="odometer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Odometer Reading</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter odometer reading" 
                        {...field} 
                        value={field.value || ''}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Performed By */}
              <FormField
                control={form.control}
                name="performed_by"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Performed By</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter technician or shop name" {...field} />
                    </FormControl>
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
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status.id} value={status.id}>
                            {status.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter service description" 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter additional notes" 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : isEditMode ? 'Update Maintenance' : 'Add Maintenance'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default MaintenanceForm;
