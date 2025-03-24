
import { VehicleStatus, Vehicle, VehicleType } from '@/types/vehicle';
import { SupabaseClient } from '@supabase/supabase-js';

// Define explicit database record types to break circular references
export interface DatabaseVehicleRecord {
  id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  color?: string | null;
  status?: string | null;
  mileage?: number | null;
  image_url?: string | null;
  description?: string | null;
  is_test_data?: boolean | null;
  location?: string | null;
  insurance_company?: string | null;
  insurance_expiry?: string | null;
  device_type?: string | null;
  rent_amount?: number | null;
  vehicle_type_id?: string | null;
  registration_number?: string | null;
  created_at: string;
  updated_at: string;
  vehicle_types?: DatabaseVehicleType | null;
}

export interface DatabaseVehicleType {
  id: string;
  name: string;
  size: string;
  daily_rate: number;
  weekly_rate?: number | null;
  monthly_rate?: number | null;
  description?: string | null;
  features: string[] | any; // Using any to handle JSON from database
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Helper function to validate status
export function isValidStatus(status: string): status is VehicleStatus {
  return ['available', 'rented', 'reserved', 'maintenance', 'police_station', 'accident', 'stolen', 'retired'].includes(status);
}

// Normalize vehicle status to ensure it matches VehicleStatus type
export function normalizeVehicleStatus(status: string | null | undefined): VehicleStatus | undefined {
  if (!status) return undefined;
  
  // Handle the "reserve" to "reserved" mapping and other potential mismatches
  if (status === 'reserve') return 'reserved';
  
  return isValidStatus(status) ? status : 'available';
}

// Convert database size string to application VehicleSize type
export function normalizeVehicleSize(size: string): string {
  // Map possible database values to valid application values
  const sizeMap: Record<string, string> = {
    'mid_size': 'midsize',
    'full_size': 'fullsize'
  };
  
  return sizeMap[size] || size;
}

// Convert database features to string array
export function normalizeFeatures(features: any): string[] {
  if (Array.isArray(features)) {
    return features;
  }
  
  // If it's a JSON string, try to parse it
  if (typeof features === 'string') {
    try {
      const parsed = JSON.parse(features);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  
  return [];
}

// Convert a database vehicle record to the application Vehicle type
export function mapDatabaseRecordToVehicle(record: DatabaseVehicleRecord): Vehicle {
  // Process the vehicle type first if it exists
  let vehicleType: VehicleType | undefined = undefined;
  
  if (record.vehicle_types) {
    const features = normalizeFeatures(record.vehicle_types.features);
    const normalizedSize = normalizeVehicleSize(record.vehicle_types.size);
    
    vehicleType = {
      id: record.vehicle_types.id,
      name: record.vehicle_types.name,
      size: normalizedSize as any, // Use type assertion for size
      daily_rate: record.vehicle_types.daily_rate,
      weekly_rate: record.vehicle_types.weekly_rate || undefined,
      monthly_rate: record.vehicle_types.monthly_rate || undefined,
      description: record.vehicle_types.description || undefined,
      features: features,
      is_active: record.vehicle_types.is_active,
      created_at: record.vehicle_types.created_at,
      updated_at: record.vehicle_types.updated_at
    };
  }
  
  // Map DB record to Vehicle type
  const vehicle: Vehicle = {
    id: record.id,
    make: record.make,
    model: record.model,
    year: record.year,
    license_plate: record.license_plate,
    licensePlate: record.license_plate, // For UI compatibility
    vin: record.vin,
    color: record.color || undefined,
    status: normalizeVehicleStatus(record.status),
    mileage: record.mileage || undefined,
    image_url: record.image_url || undefined,
    imageUrl: record.image_url || undefined, // For UI compatibility
    description: record.description || undefined,
    is_test_data: record.is_test_data || undefined,
    location: record.location || undefined,
    insurance_company: record.insurance_company || undefined,
    insurance_expiry: record.insurance_expiry || undefined,
    device_type: record.device_type || undefined,
    rent_amount: record.rent_amount || undefined,
    vehicle_type_id: record.vehicle_type_id || undefined,
    registration_number: record.registration_number || undefined,
    created_at: record.created_at,
    updated_at: record.updated_at,
    
    // Add UI compatibility computed fields
    notes: record.description || undefined,
    vehicleType: vehicleType,
    dailyRate: record.rent_amount || (vehicleType?.daily_rate || 0),
    category: vehicleType?.size || 'midsize'
  };
  
  // Add features if vehicleType exists
  if (vehicleType && vehicleType.features) {
    vehicle.features = vehicleType.features;
  }
  
  return vehicle;
}
