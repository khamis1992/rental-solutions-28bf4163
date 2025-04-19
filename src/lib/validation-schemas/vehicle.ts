
import * as z from "zod";

// Define the vehicle status enum
export enum VehicleStatus {
  AVAILABLE = "available",
  RENTED = "rented",
  RESERVED = "reserved",
  MAINTENANCE = "maintenance",
  POLICE_STATION = "police_station",
  ACCIDENT = "accident",
  STOLEN = "stolen",
  RETIRED = "retired"
}

// Define the vehicle schema
export const vehicleSchema = z.object({
  id: z.string().optional(),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  license_plate: z.string().min(1, "License plate is required"),
  licensePlate: z.string().optional(),
  vin: z.string().min(1, "VIN is required"),
  color: z.string().optional(),
  status: z.nativeEnum(VehicleStatus).optional(),
  mileage: z.number().optional(),
  image_url: z.string().optional(),
  imageUrl: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  is_test_data: z.boolean().optional(),
  location: z.string().optional(),
  insurance_company: z.string().optional(),
  insurance_expiry: z.string().optional().nullable(),
  device_type: z.string().optional(),
  rent_amount: z.number().optional(),
  dailyRate: z.number().optional(),
  vehicle_type_id: z.string().optional(),
  registration_number: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

// Define the vehicle type
export type Vehicle = z.infer<typeof vehicleSchema>;
