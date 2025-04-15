
import { z } from 'zod';

// Define enum for vehicle status
export enum VehicleStatus {
  AVAILABLE = 'available',
  RENTED = 'rented',
  MAINTENANCE = 'maintenance',
  RETIRED = 'retired',
  POLICE_STATION = 'police_station',
  ACCIDENT = 'accident',
  STOLEN = 'stolen',
  RESERVED = 'reserved'
}

// Create a schema for vehicle validation
export const vehicleSchema = z.object({
  make: z.string().min(1, { message: "Make is required" }),
  model: z.string().min(1, { message: "Model is required" }),
  year: z.number().int().min(1900, { message: "Year must be valid" }).max(new Date().getFullYear() + 1),
  license_plate: z.string().min(1, { message: "License plate is required" }),
  vin: z.string().min(1, { message: "VIN is required" }),
  color: z.string().optional().nullable(),
  mileage: z.number().int().min(0).optional().nullable(),
  status: z.nativeEnum(VehicleStatus).default(VehicleStatus.AVAILABLE),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  insurance_company: z.string().optional().nullable(),
  insurance_expiry: z.string().optional().nullable(),
  rent_amount: z.number().min(0).optional().nullable(),
  vehicle_type_id: z.string().optional().nullable(),
});

export type VehicleFormValues = z.infer<typeof vehicleSchema>;

// Schema for updating vehicle
export const vehicleUpdateSchema = vehicleSchema.partial();

// Schema for filtering vehicles
export const vehicleFilterSchema = z.object({
  status: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().optional().nullable(),
  minYear: z.number().optional().nullable(),
  maxYear: z.number().optional().nullable(),
  searchTerm: z.string().optional(),
  sortBy: z.string().optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
  location: z.string().optional(),
  vehicle_type_id: z.string().optional(),
});
