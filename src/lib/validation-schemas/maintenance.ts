
import { z } from 'zod';

export const maintenanceSchema = z.object({
  id: z.string().optional(),
  maintenance_type: z.string(),
  description: z.string().optional(),
  cost: z.number().min(0).optional(),
  scheduled_date: z.string().or(z.date()),
  completion_date: z.string().or(z.date()).optional().nullable(),
  status: z.string(),
  service_provider: z.string().optional(),
  vehicle_id: z.string().optional().nullable(),
  notes: z.string().optional(),
  service_type: z.string().optional(),
  category_id: z.string().optional()
});

export type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

// Maintenance status and type enums
export enum MaintenanceStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum MaintenanceType {
  REGULAR_INSPECTION = 'REGULAR_INSPECTION',
  REPAIR = 'REPAIR',
  OIL_CHANGE = 'OIL_CHANGE',
  TIRE_ROTATION = 'TIRE_ROTATION',
  BRAKE_SERVICE = 'BRAKE_SERVICE',
  OTHER = 'OTHER',
}
