
import React, { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { useVehicles } from '@/hooks/use-vehicles';
import { useMaintenance } from '@/hooks/use-maintenance';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Define MaintenanceRecord type properly
interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  maintenance_type: "REGULAR_INSPECTION" | "OIL_CHANGE" | "TIRE_REPLACEMENT" | "BRAKE_SERVICE" | "OTHER";
  description: string;
  scheduled_date: string;
  cost: number;
  estimated_cost?: string;
  notes: string;
  assigned_to: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  created_at?: string;
  updated_at?: string;
}

// Define the form schema
const maintenanceFormSchema = z.object({
  vehicle_id: z.string().min(1, "Vehicle is required"),
  maintenance_type: z.enum(["REGULAR_INSPECTION", "OIL_CHANGE", "TIRE_REPLACEMENT", "BRAKE_SERVICE", "OTHER"]),
  description: z.string().min(3, "Description is required"),
  scheduled_date: z.string().min(1, "Scheduled date is required"),
  estimated_cost: z.string().optional(),
  notes: z.string().optional(),
  assigned_to: z.string().optional(),
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]),
});

type MaintenanceFormValues = z.infer<typeof maintenanceFormSchema>;

const MaintenanceSchedulingWizard = () => {
  const { vehicles } = useVehicles();
  const { addMaintenanceRecord } = useMaintenance();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceFormSchema),
    defaultValues: {
      maintenance_type: "REGULAR_INSPECTION",
      description: "",
      scheduled_date: "",
      estimated_cost: "",
      notes: "",
      assigned_to: "",
      status: "scheduled",
    },
  });

  const onSubmit = async (values: MaintenanceFormValues) => {
    setIsSubmitting(true);
    try {
      // Convert estimated_cost from string to number for the database
      const cost = parseFloat(values.estimated_cost || "0");
      
      await addMaintenanceRecord({
        vehicle_id: values.vehicle_id,
        maintenance_type: values.maintenance_type,
        description: values.description,
        scheduled_date: values.scheduled_date,
        cost: cost,
        estimated_cost: values.estimated_cost || "0",
        notes: values.notes || "",
        assigned_to: values.assigned_to || "",
        status: values.status,
      });
      toast.success("Maintenance scheduled successfully!");
      navigate("/maintenance");
    } catch (error) {
      console.error("Error scheduling maintenance:", error);
      toast.error("Failed to schedule maintenance");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Schedule Maintenance</h1>
        <p className="text-muted-foreground">Create a new maintenance task for a vehicle</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    {vehicles && Array.isArray(vehicles) && vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Select the vehicle for maintenance</FormDescription>
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
                    <SelectItem value="REGULAR_INSPECTION">Regular Inspection</SelectItem>
                    <SelectItem value="OIL_CHANGE">Oil Change</SelectItem>
                    <SelectItem value="TIRE_REPLACEMENT">Tire Replacement</SelectItem>
                    <SelectItem value="BRAKE_SERVICE">Brake Service</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Select the type of maintenance</FormDescription>
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
                  <Textarea placeholder="Describe the maintenance task" {...field} />
                </FormControl>
                <FormDescription>Provide a clear description of what needs to be done</FormDescription>
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
            name="estimated_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Cost</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0.00" {...field} />
                </FormControl>
                <FormDescription>Estimated cost of the maintenance (optional)</FormDescription>
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
                <FormDescription>Any additional information (optional)</FormDescription>
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
                <FormDescription>Who will perform this maintenance? (optional)</FormDescription>
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
                <FormDescription>Current status of the maintenance task</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              "Schedule Maintenance"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default MaintenanceSchedulingWizard;
