/**
 * Zod schemas for maintenance data validation
 */
import { z } from 'zod';

/**
 * Maintenance status schema
 */
export const maintenanceStatusSchema = z.enum([
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
  'overdue'
]);

/**
 * Maintenance type schema
 */
export const maintenanceTypeSchema = z.enum([
  'routine',
  'repair',
  'inspection',
  'emergency',
  'recall',
  'other'
]);

/**
 * Maintenance priority schema
 */
export const maintenancePrioritySchema = z.enum([
  'low',
  'medium',
  'high',
  'critical'
]);

/**
 * Maintenance schema for validation
 */
export const maintenanceSchema = z.object({
  id: z.string().optional(),
  vehicle_id: z.string(),
  category_id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  maintenance_type: maintenanceTypeSchema,
  status: maintenanceStatusSchema,
  priority: maintenancePrioritySchema,
  cost: z.number().nonnegative().optional(),
  scheduled_date: z.string().optional(),
  completed_date: z.string().optional(),
  odometer_reading: z.number().int().nonnegative().optional(),
  technician_name: z.string().optional(),
  notes: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  assigned_to: z.string().optional(),
  parts_used: z.array(z.string()).optional(),
  documents: z.array(z.string()).optional(),
  next_maintenance_date: z.string().optional(),
  next_maintenance_odometer: z.number().int().nonnegative().optional()
});

/**
 * Maintenance insert schema for validation
 */
export const maintenanceInsertSchema = maintenanceSchema.omit({ 
  id: true,
  created_at: true,
  updated_at: true
});

/**
 * Maintenance update schema for validation
 */
export const maintenanceUpdateSchema = maintenanceSchema.partial();

/**
 * Maintenance document schema
 */
export const maintenanceDocumentSchema = z.object({
  id: z.string().optional(),
  maintenance_id: z.string(),
  file_name: z.string().min(1, 'File name is required'),
  file_path: z.string().min(1, 'File path is required'),
  file_type: z.string(),
  file_size: z.number().nonnegative().optional(),
  uploaded_by: z.string().optional(),
  description: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

/**
 * Maintenance task schema
 */
export const maintenanceTaskSchema = z.object({
  id: z.string().optional(),
  maintenance_id: z.string(),
  description: z.string().min(1, 'Description is required'),
  status: z.enum(['pending', 'completed', 'skipped']),
  assigned_to: z.string().optional(),
  estimated_time: z.number().nonnegative().optional(),
  actual_time: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

/**
 * Schedule maintenance schema
 */
export const scheduleMaintenanceSchema = z.object({
  vehicleId: z.string(),
  scheduledDate: z.date(),
  maintenanceType: maintenanceTypeSchema.optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  priority: maintenancePrioritySchema.optional(),
  categoryId: z.string().optional(),
  assignedTo: z.string().optional()
});
