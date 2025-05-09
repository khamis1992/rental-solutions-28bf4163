
import { z } from 'zod';

export const vehicleSchema = z.object({
  make: z.string().min(1, { message: "Make is required" }),
  model: z.string().min(1, { message: "Model is required" }),
  year: z.number().min(1900, { message: "Year must be valid" }).max(new Date().getFullYear() + 1),
  license_plate: z.string().min(1, { message: "License plate is required" }),
  color: z.string().optional(),
  status: z.string().optional(),
  description: z.string().optional(),
  vin: z.string().optional(),
  mileage: z.number().min(0).optional(),
  vehicle_type_id: z.string().optional(),
  rent_amount: z.number().min(0).optional(),
});

export type VehicleFormData = z.infer<typeof vehicleSchema>;

export enum VehicleStatus {
  AVAILABLE = 'available',
  RENTED = 'rented',
  RESERVED = 'reserved',
  MAINTENANCE = 'maintenance',
  POLICE_STATION = 'police_station',
  ACCIDENT = 'accident',
  STOLEN = 'stolen',
  RETIRED = 'retired'
}
