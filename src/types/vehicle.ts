
/**
 * Vehicle status options from the database schema
 */
export type VehicleStatus = 
  | 'available' 
  | 'rented' 
  | 'maintenance' 
  | 'retired' 
  | 'police_station' 
  | 'accident' 
  | 'stolen' 
  | 'reserved';

/**
 * Database vehicle status options (might differ from frontend enum)
 */
export type DatabaseVehicleStatus = 
  | 'available' 
  | 'rented' 
  | 'maintenance' 
  | 'retired' 
  | 'police_station' 
  | 'accident' 
  | 'stolen' 
  | 'reserve';  // Note: 'reserve' in DB vs 'reserved' in frontend

/**
 * Database vehicle record from Supabase
 */
export interface DatabaseVehicleRecord {
  id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  color?: string | null;
  image_url?: string | null;
  mileage?: number | null;
  status: DatabaseVehicleStatus | null;
  created_at: string;
  updated_at: string;
  description?: string | null;
  location?: string | null;
  insurance_company?: string | null;
  insurance_expiry?: string | null;
  rent_amount?: number | null;
  vehicle_type_id?: string | null;
  vehicle_types?: DatabaseVehicleType | null;
  additional_images?: string[] | null;
  notes?: string | null;
  monthly_rate?: number | null;
  daily_rate?: number | null;
  [key: string]: any;  // Allow extra fields for flexibility
}

/**
 * Database vehicle type record from Supabase
 */
export interface DatabaseVehicleType {
  id: string;
  name: string;
  size: string;
  daily_rate: number;
  weekly_rate?: number | null;
  monthly_rate?: number | null;
  description?: string | null;
  features?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Vehicle interface definition
 */
export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  color?: string | null;
  image_url?: string | null;
  mileage?: number | null;
  status: VehicleStatus;
  created_at: string;
  updated_at: string;
  description?: string | null;
  location?: string | null;
  insurance_company?: string | null;
  insurance_expiry?: string | null;
  rent_amount?: number | null;
  vehicle_type_id?: string | null;
  currentCustomer?: string | null;
  dailyRate?: number | null;
  monthlyRate?: number | null;
  notes?: string | null;
  additional_images?: string[] | null;
  vehicleType?: {
    id: string;
    name: string;
    daily_rate: number;
    description?: string;
  };
  vehicle_type?: {
    id: string;
    name: string;
    daily_rate: number;
    description?: string;
  };
  // Added for compatibility with some components
  daily_rate?: number;
  monthly_rate?: number;
}

/**
 * Vehicle form data for creating/editing vehicles
 */
export interface VehicleFormData {
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  color?: string | null;
  mileage?: number | null;
  status?: VehicleStatus;
  description?: string | null;
  location?: string | null;
  insurance_company?: string | null;
  insurance_expiry?: string | null;
  rent_amount?: number | null;
  vehicle_type_id?: string | null;
  image?: File | null;
}

export interface VehicleInsertData {
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  color?: string;
  mileage?: number;
  rent_amount?: number;
  status?: string;
  vehicle_type_id?: string;
  description?: string;
  image_url?: string;
  location?: string;
  insurance_company?: string;
  insurance_expiry?: string | Date;
  device_type?: string;
}

export interface VehicleUpdateData {
  make?: string;
  model?: string;
  year?: number;
  license_plate?: string;
  vin?: string;
  color?: string;
  mileage?: number;
  rent_amount?: number;
  status?: string;
  vehicle_type_id?: string;
  description?: string;
  image_url?: string;
  location?: string;
  insurance_company?: string;
  insurance_expiry?: string | Date;
  device_type?: string;
  image?: File | null;
  updated_at?: string;
}

// Update VehicleFilterParams to include missing properties
export interface VehicleFilterParams {
  status?: string;
  statuses?: string[];
  searchTerm?: string;
  cursor?: string;
  location?: string;
  vehicle_type_id?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  make?: string;
  model?: string;
  year?: number;
  search?: string;
}

/**
 * Vehicle type definition
 */
export interface VehicleType {
  id: string;
  name: string;
  size: string;
  daily_rate: number;
  weekly_rate?: number;
  monthly_rate?: number;
  description?: string;
}
