
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import { maintenanceSchema } from '@/lib/validation-schemas/maintenance';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DatePicker } from "@/components/ui/date-picker";
import { useVehicle } from '@/hooks/use-vehicle';
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const MaintenanceForm = ({ initialData = null }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { vehicles } = useVehicle();
  
  const form = useForm({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      vehicle_id: initialData?.vehicle_id || "",
      maintenance_type: initialData?.maintenance_type || "",
      description: initialData?.description || "",
      cost: initialData?.cost || "",
      date_performed: initialData?.date_performed ? new Date(initialData.date_performed) : null,
      next_maintenance_date: initialData?.next_maintenance_date ? new Date(initialData.next_maintenance_date) : null,
      service_provider: initialData?.service_provider || "",
      notes: initialData?.notes || "",
      status: initialData?.status || "completed",
    }
  });

  useEffect(() => {
    if (initialData) {
      Object.keys(initialData).forEach((key) => {
        if (key === 'date_performed' || key === 'next_maintenance_date') {
          if (initialData[key]) {
            form.setValue(key, new Date(initialData[key]));
          }
        } else {
          form.setValue(key, initialData[key]);
        }
      });
    }
  }, [initialData, form]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const formattedData = {
        ...data,
        date_performed: data.date_performed?.toISOString(),
        next_maintenance_date: data.next_maintenance_date?.toISOString(),
        cost: parseFloat(data.cost)
      };

      if (initialData?.id) {
        // Update existing maintenance record
        const { error } = await supabase
          .from('maintenance')
          .update(formattedData)
          .eq('id', initialData.id);
          
        if (error) {
          throw error;
        }
        
        toast.success("Maintenance record updated successfully!");
        navigate('/maintenance');
      } else {
        // Create new maintenance record
        const { error } = await supabase
          .from('maintenance')
          .insert(formattedData);
          
        if (error) {
          throw error;
        }
        
        toast.success("Maintenance record created successfully!");
        navigate('/maintenance');
      }
    } catch (error) {
      console.error("Error submitting maintenance form:", error);
      toast.error("Failed to save maintenance record. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const vehicleOptions = vehicles && Array.isArray(vehicles) 
    ? vehicles 
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? "Edit Maintenance Record" : "Add New Maintenance Record"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="vehicle_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a vehicle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicleOptions.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.make} {vehicle.model} - {vehicle.license_plate}
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select maintenance type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="oil_change">Oil Change</SelectItem>
                        <SelectItem value="tire_rotation">Tire Rotation</SelectItem>
                        <SelectItem value="brake_service">Brake Service</SelectItem>
                        <SelectItem value="inspection">Inspection</SelectItem>
                        <SelectItem value="engine_repair">Engine Repair</SelectItem>
                        <SelectItem value="transmission_service">Transmission Service</SelectItem>
                        <SelectItem value="body_repair">Body Repair</SelectItem>
                        <SelectItem value="electrical">Electrical System</SelectItem>
                        <SelectItem value="air_conditioning">Air Conditioning</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="date_performed"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date Performed</FormLabel>
                    <DatePicker
                      date={field.value}
                      setDate={field.onChange}
                    />
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
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
                      <Input placeholder="Enter service provider" {...field} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                name="next_maintenance_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Next Maintenance Date</FormLabel>
                    <DatePicker
                      date={field.value}
                      setDate={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter maintenance description" {...field} />
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
                    <Textarea placeholder="Enter additional notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CardFooter className="px-0 pb-0">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Saving..." : initialData ? "Update Maintenance Record" : "Create Maintenance Record"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default MaintenanceForm;
