/**
 * Vehicle status options from the database schema
 * - available: Vehicle is ready for rental
 * - rented: Currently under an active lease
 * - maintenance: Under maintenance or repair
 * - reserved: Reserved for future rental
 * - retired: Vehicle that has been taken out of service
 * - police_station: Vehicle is held at a police station
 * - accident: Vehicle is involved in an accident
 * - stolen: Vehicle has been reported as stolen
 */
import { Database } from './database.types';

export type VehicleStatus = Database['public']['Enums']['vehicle_status'];

/**
 * Core vehicle data structure representing a vehicle in the fleet
 */
export interface Vehicle {
  /** Unique identifier for the vehicle */
  id: string;
  /** Current operational status */
  status: VehicleStatus;
  /** Vehicle manufacturer */
  make: string;
  /** Vehicle model */
  model: string;
  /** Manufacturing year */
  year: number;
  /** License plate number */
  license_plate: string;
  /** Vehicle Identification Number */
  vin: string;
  /** Vehicle color */
  color?: string | null;
  /** URL to vehicle image */
  image_url?: string | null;
  /** Current mileage */
  mileage?: number | null;
  /** Daily rental rate */
  rent_amount?: number | null;
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
  /** Additional vehicle description */
  description?: string | null;
  /** Current location/branch */
  location?: string | null;
  /** Insurance provider company name */
  insurance_company?: string | null;
  /** Insurance expiry date */
  insurance_expiry?: string | null;
  /** Vehicle category/type ID reference */
  vehicle_type_id?: string | null;
  /** Current customer ID if rented */
  currentCustomer?: string | null;
  /** Daily rental rate (alias) */
  dailyRate?: number | null;
  /** Additional notes about the vehicle */
  notes?: string | null;
  /** Indicates if this is test data */
  is_test_data?: boolean;
  /** Vehicle type information */
  vehicleType?: {
    id: string;
    name: string;
    daily_rate?: number;
    size?: string;
  };
  // Additional properties from database joins
  maintenance?: any[];
  vehicle_types?: any;  // Raw database joined data
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
  maintenance?: any[];
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
