
// Vehicle status enum from Supabase
export type VehicleStatus = 'available' | 'rented' | 'reserved' | 'maintenance' | 'police_station' | 'accident' | 'stolen' | 'retired';

// Vehicle size enum for vehicle types
export type VehicleSize = 'compact' | 'midsize' | 'fullsize' | 'suv' | 'luxury' | 'truck' | 'van' | 'economy';

// Vehicle type definition matching Supabase schema
export interface VehicleType {
  id: string;
  name: string;
  size: VehicleSize;
  daily_rate: number;
  weekly_rate?: number;
  monthly_rate?: number;
  description?: string;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Vehicle interface matching Supabase schema
export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  created_at: string;
  updated_at: string;
  
  // Optional fields
  color?: string;
  status?: VehicleStatus;
  mileage?: number;
  image_url?: string;
  description?: string;
  is_test_data?: boolean;
  location?: string;
  insurance_company?: string;
  insurance_expiry?: string;
  device_type?: string;
  rent_amount?: number;
  vehicle_type_id?: string;
  registration_number?: string;
  
  // Client-side computed fields (not in DB)
  vehicleType?: VehicleType;
  
  // Compatibility with existing UI
  imageUrl?: string; // Maps to image_url
  licensePlate?: string; // Maps to license_plate
  dailyRate?: number; // Maps to rent_amount or vehicleType.daily_rate
  fuelLevel?: number; // Will be deprecated
  lastServiced?: string; // Will be fetched from maintenance records
  nextServiceDue?: string; // Will be fetched from maintenance records
  fuelType?: 'gasoline' | 'diesel' | 'electric' | 'hybrid'; // Will be added to vehicle_types
  transmission?: 'automatic' | 'manual'; // Will be added to vehicle_types
  category?: 'economy' | 'compact' | 'midsize' | 'fullsize' | 'luxury' | 'suv' | 'truck' | 'van'; // Maps to vehicleType.size
  features?: string[]; // Will be fetched from vehicleType.features
  notes?: string; // Maps to description
}

// Form data interface for vehicle creation/update
export interface VehicleFormData {
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  color?: string;
  status?: VehicleStatus;
  mileage?: number;
  description?: string;
  location?: string;
  insurance_company?: string;
  insurance_expiry?: string;
  rent_amount?: number;
  vehicle_type_id?: string;
  image?: File | null;
  registration_number?: string;
}

// Interface for filtering vehicles in the UI
export interface VehicleFilterParams {
  status?: VehicleStatus;
  make?: string;
  vehicle_type_id?: string; 
  location?: string;
  year?: number;
  [key: string]: string | number | undefined;
}

// Database table type for vehicles (matching Supabase schema)
export interface VehicleInsertData {
  make?: string;
  model?: string;
  year?: number;
  license_plate?: string;
  vin?: string;
  color?: string | null;
  status?: VehicleStatus | null;
  mileage?: number | null;
  image_url?: string | null;
  description?: string | null;
  location?: string | null;
  insurance_company?: string | null;
  insurance_expiry?: string | null;
  rent_amount?: number | null;
  vehicle_type_id?: string | null;
  registration_number?: string | null;
}
