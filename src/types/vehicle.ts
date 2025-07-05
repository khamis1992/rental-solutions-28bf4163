import { Database } from './database.types';
import { isValidVehicleStatus, getVehicleStatusDisplay, getVehicleStatusColor } from '@/lib/validation/vehicle-status';

/**
 * Vehicle status options from the database schema
 */
export type VehicleStatus = 
  | 'available'
  | 'rented'
  | 'reserved'
  | 'maintenance'
  | 'police_station'
  | 'accident'
  | 'stolen'
  | 'retired';

/**
 * Core vehicle data structure representing a vehicle in the fleet
 */
export type VehicleRow = Database['public']['Tables']['vehicles']['Row'];
export type VehicleInsert = Database['public']['Tables']['vehicles']['Insert'];
export type VehicleUpdate = Database['public']['Tables']['vehicles']['Update'];
export type VehicleId = VehicleRow['id'];

/**
 * Vehicle type definition
 */
export interface VehicleType {
  id: string;
  name: string;
  size: string;
  daily_rate: number;
  weekly_rate?: number | null;
  monthly_rate?: number | null;
  description?: string | null;
  features?: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Vehicle maintenance record
 */
export interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  maintenance_type: string;
  cost: number;
  maintenance_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Extended vehicle information including maintenance and rental history
 */
export interface ExtendedVehicle extends Database['public']['Tables']['vehicles']['Row'] {
  make: string;
  model: string;
  year: number;
  vin: string;
  license_plate?: string;
  status: VehicleStatus;
  location: string;
  vehicle_type_id: string;
  mileage: number;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  daily_rate: number;
  weekly_rate: number;
  monthly_rate: number;
  images?: string[];
  features?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
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
  image?: File | null;
}

/**
 * Vehicle filter parameters type
 */
export interface VehicleFilterParams {
  statuses?: VehicleStatus[];
  make?: string;
  model?: string;
  year?: number;
  minYear?: number;
  maxYear?: number;
  searchTerm?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  location?: string;
  vehicle_type_id?: string;
}

/**
 * Vehicle filters for database queries
 */
export interface VehicleFilters {
  status?: VehicleStatus;
  make?: string;
  model?: string;
  year?: number;
}

/**
 * Helper function to ensure type safety when creating vehicles
 */
export function createVehicleData(data: Partial<VehicleRow>): VehicleInsert {
  const {
    make,
    model,
    year,
    vin,
    license_plate,
    color,
    status,
    engine_number,
    model_number,
    attention_needed_notes,
    notes
  } = data;

  return {
    make,
    model,
    year,
    vin,
    license_plate,
    color,
    status,
    engine_number,
    model_number,
    attention_needed_notes,
    notes
  } as VehicleInsert;
}

// Re-export the status display functions
export { getVehicleStatusDisplay, getVehicleStatusColor };
