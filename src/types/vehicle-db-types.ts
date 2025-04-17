
/**
 * Database vehicle record type definition
 */
export interface DatabaseVehicleRecord {
  id: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  license_plate: string;
  vin: string;
  mileage?: number;
  status?: string;
  description?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
  vehicle_type_id?: string;
  vehicle_types?: DatabaseVehicleType;
  rent_amount?: number;
  insurance_company?: string;
  insurance_expiry?: string;
  location?: string;
}

/**
 * Database vehicle type definition
 */
export interface DatabaseVehicleType {
  id: string;
  name: string;
  size: string;
  daily_rate: number;
  weekly_rate?: number;
  monthly_rate?: number;
  description?: string;
  features?: any;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Vehicle type definition
 */
export interface VehicleType {
  id: string;
  name: string;
  size: 'compact' | 'midsize' | 'fullsize' | 'suv' | 'luxury' | 'truck' | 'van';
  daily_rate: number;
  weekly_rate?: number;
  monthly_rate?: number;
  description?: string;
  features?: string[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Vehicle insert data
 */
export interface VehicleInsertData {
  make: string;
  model: string;
  year: number;
  color?: string;
  license_plate: string;
  vin: string;
  mileage?: number;
  status?: string;
  description?: string;
  image_url?: string;
  vehicle_type_id?: string;
  rent_amount?: number;
  insurance_company?: string;
  insurance_expiry?: string;
  location?: string;
}

/**
 * Vehicle update data
 */
export interface VehicleUpdateData {
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  license_plate?: string;
  vin?: string;
  mileage?: number;
  status?: string;
  description?: string;
  image_url?: string;
  vehicle_type_id?: string;
  rent_amount?: number;
  insurance_company?: string;
  insurance_expiry?: string;
  location?: string;
  updated_at?: string;
}
