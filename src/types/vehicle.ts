import { Database } from '@/types/database.types';

/**
 * Vehicle status options from the database schema
 */
export type VehicleStatus = NonNullable<Database['public']['Tables']['vehicles']['Row']['status']>;

/**
 * Vehicle interface definition
 */
export type Vehicle = {
  id: string;
  color: string | null;
  created_at: string;
  description: string | null;
  device_type: string | null;
  image_url: string | null;
  insurance_company: string | null;
  insurance_expiry: string | null;
  is_test_data: boolean | null;
  license_plate: string;
  location: string | null;
  make: string;
  mileage: number | null;
  model: string;
  rent_amount: number | null;
  status: VehicleStatus | null;
  updated_at: string;
  vehicle_type_id: string | null;
  vin: string;
  year: number;
  notes: string | null;
  engine_number: string | null;
  model_number: string | null;
  attention_needed_notes: string | null;
  
  // Relationship data
  vehicle_type?: {
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
  };
  maintenance_records?: Array<{
    id: string;
    vehicle_id: string;
    maintenance_type: string;
    cost: number;
    maintenance_date: string;
    status: string;
    created_at: string;
    updated_at: string;
  }>;
  agreements?: Database['public']['Tables']['leases']['Row'][];
  
  // Computed/derived fields
  full_name?: string;
  status_display?: string;
  type_display?: string;
};

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

// Database operation types
export type VehicleInsert = Database['public']['Tables']['vehicles']['Insert'];
export type VehicleUpdate = Database['public']['Tables']['vehicles']['Update'];

// Helper function to ensure type safety when creating vehicles
export function createVehicleData(data: Partial<Vehicle>): VehicleInsert {
  const {
    make,
    model,
    year,
    vin,
    license_plate,
    color,
    status,
    vehicle_type_id,
    location,
    notes,
    description,
    image_url,
    insurance_company,
    insurance_expiry,
    rent_amount,
    mileage,
    engine_number,
    model_number,
    attention_needed_notes,
    device_type,
    is_test_data
  } = data;

  return {
    make,
    model,
    year,
    vin,
    license_plate,
    color,
    status,
    vehicle_type_id,
    location,
    notes,
    description,
    image_url,
    insurance_company,
    insurance_expiry,
    rent_amount,
    mileage,
    engine_number,
    model_number,
    attention_needed_notes,
    device_type,
    is_test_data
  } as VehicleInsert;
}

// Helper function to validate vehicle status
export function isValidVehicleStatus(status: string | null): status is VehicleStatus {
  if (!status) return false;
  const validStatuses: VehicleStatus[] = [
    'available',
    'rented',
    'reserved',
    'maintenance',
    'police_station',
    'accident',
    'stolen',
    'retired'
  ];
  return validStatuses.includes(status as VehicleStatus);
}

// Helper function to get display name for vehicle status
export function getVehicleStatusDisplay(status: VehicleStatus | null): string {
  if (!status) return 'Unknown';
  
  switch (status) {
    case 'available':
      return 'Available';
    case 'rented':
      return 'Rented';
    case 'reserved':
      return 'Reserved';
    case 'maintenance':
      return 'In Maintenance';
    case 'police_station':
      return 'At Police Station';
    case 'accident':
      return 'In Accident';
    case 'stolen':
      return 'Stolen';
    case 'retired':
      return 'Retired';
    default:
      return 'Unknown';
  }
}
