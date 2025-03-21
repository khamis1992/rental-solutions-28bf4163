
import { z } from "zod";

// Define maintenance types
export const MaintenanceType = {
  OIL_CHANGE: "oil_change",
  TIRE_REPLACEMENT: "tire_replacement",
  BRAKE_SERVICE: "brake_service",
  REGULAR_INSPECTION: "regular_inspection",
  ENGINE_REPAIR: "engine_repair",
  TRANSMISSION_SERVICE: "transmission_service",
  ELECTRICAL_REPAIR: "electrical_repair",
  BODY_REPAIR: "body_repair",
  AIR_CONDITIONING: "air_conditioning",
  OTHER: "other"
} as const;

// Define maintenance statuses - lowercase values for frontend schema
// but DB uses uppercase values
export const MaintenanceStatus = {
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled"
} as const;

// Define type for frontend status values
export type MaintenanceStatusType = typeof MaintenanceStatus[keyof typeof MaintenanceStatus];

// Vehicle reference schema (simplified)
export const VehicleRefSchema = z.object({
  id: z.string(),
  make: z.string(),
  model: z.string(),
  license_plate: z.string(),
  image_url: z.string().optional()
});

// Maintenance record validation schema
export const maintenanceSchema = z.object({
  id: z.string().optional(),
  vehicle_id: z.string().min(1, "Vehicle is required"),
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
  ]),
  status: z.enum([
    MaintenanceStatus.SCHEDULED,
    MaintenanceStatus.IN_PROGRESS,
    MaintenanceStatus.COMPLETED,
    MaintenanceStatus.CANCELLED
  ]),
  description: z.string().optional(),
  cost: z.number().min(0, "Cost must be a positive number").optional(),
  scheduled_date: z.date(),
  completion_date: z.date().optional(),
  service_provider: z.string().optional(),
  invoice_number: z.string().optional(),
  odometer_reading: z.number().optional(),
  notes: z.string().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
  // Include the nested vehicle object from Supabase
  vehicles: VehicleRefSchema.optional(),
});

// Type for Maintenance based on the schema
export type Maintenance = z.infer<typeof maintenanceSchema>;

// Type for Maintenance filters
export type MaintenanceFilters = Partial<{
  query: string;
  status: MaintenanceStatusType;
  vehicle_id: string;
  maintenance_type: string;
  date_from: Date;
  date_to: Date;
}>;

// Helper for creating a new maintenance record
export const createEmptyMaintenance = (): Omit<Maintenance, "id"> => ({
  vehicle_id: "",
  maintenance_type: MaintenanceType.REGULAR_INSPECTION,
  status: MaintenanceStatus.SCHEDULED,
  scheduled_date: new Date(),
  description: "",
  cost: 0,
  service_provider: "",
  invoice_number: "",
  odometer_reading: 0,
  notes: "",
});
