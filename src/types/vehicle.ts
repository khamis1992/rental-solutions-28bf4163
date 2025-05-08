
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

