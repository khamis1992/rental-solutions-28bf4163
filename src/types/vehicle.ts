
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
  notes?: string | null;
  vehicleType?: {
    id: string;
    name: string;
    daily_rate?: number;
    size?: string;
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
  notes?: string | null;
}

/**
 * Vehicle filter parameters type
 */
export interface VehicleFilterParams {
  status?: string;
  statuses?: string[];
  make?: string;
  model?: string;
  year?: number | null;
  minYear?: number | null;
  maxYear?: number | null;
  searchTerm?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  location?: string;
  vehicle_type_id?: string;
  search?: string;
  [key: string]: any;
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
  features?: string[];
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Type for database record conversion
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
  status?: DatabaseVehicleStatus | null;
  created_at: string;
  updated_at: string;
  description?: string | null;
  location?: string | null;
  insurance_company?: string | null;
  insurance_expiry?: string | null;
  rent_amount?: number | null;
  vehicle_type_id?: string | null;
  notes?: string | null;
  vehicle_types?: DatabaseVehicleType | null;
}

export type DatabaseVehicleStatus = string;

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

export type VehicleInsertData = Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>;
export type VehicleUpdateData = Partial<VehicleInsertData>;
