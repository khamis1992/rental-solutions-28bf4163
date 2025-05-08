
import { z } from 'zod';
import { MaintenanceStatus, MaintenanceType } from '@/lib/validation-schemas/maintenance';

// Create a zod schema for the maintenance form
export const maintenanceFormSchema = z.object({
  maintenance_type: z.enum([
    MaintenanceType.OIL_CHANGE,
    MaintenanceType.TIRE_REPLACEMENT, 
    MaintenanceType.BRAKE_SERVICE,
    MaintenanceType.REGULAR_INSPECTION,
    MaintenanceType.ENGINE_REPAIR,
    MaintenanceType.TRANSMISSION_SERVICE,
    MaintenanceType.ELECTRICAL_REPAIR,
    MaintenanceType.BODY_REPAIR,
    MaintenanceType.AIR_CONDITIONING,
    MaintenanceType.OTHER
  ], {
    required_error: "Maintenance type is required"
  }),
  description: z.string().optional(),
  scheduled_date: z.string().min(1, "Scheduled date is required"),
  estimated_cost: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, 
    { message: "Estimated cost must be a valid number" }
  ),
  assigned_to: z.string().optional(),
  notes: z.string().optional(),
  vehicle_id: z.string().optional(),
  status: z.enum([
    MaintenanceStatus.SCHEDULED,
    MaintenanceStatus.IN_PROGRESS,
    MaintenanceStatus.COMPLETED,
    MaintenanceStatus.CANCELLED
  ]).default(MaintenanceStatus.SCHEDULED)
});

export type MaintenanceFormData = z.infer<typeof maintenanceFormSchema>;

// Helper function to transform form data to the correct format for submission
export const transformFormData = (data: MaintenanceFormData) => {
  return {
    ...data,
    estimated_cost: data.estimated_cost ? parseFloat(data.estimated_cost) : 0,
  };
};
