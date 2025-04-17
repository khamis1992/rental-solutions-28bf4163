
import { VehicleStatus } from './vehicle';

export interface DatabaseVehicleRecord {
  id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  color?: string | null;
  mileage?: number | null;
  status?: string | null; // Database status might be slightly different from app status
  description?: string | null;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
  rent_amount?: number | null;
  insurance_company?: string | null;
  insurance_expiry?: string | null;
  location?: string | null;
  vehicle_types?: DatabaseVehicleType | null;
  vehicle_type_id?: string | null;
}

export interface DatabaseVehicleType {
  id: string;
  name: string;
  description?: string;
  daily_rate: number;
  weekly_rate?: number;
  monthly_rate?: number;
  size?: string;
  features?: any; // Can be string[], object, or string (JSON)
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface VehicleType {
  id: string;
  name: string;
  description?: string;
  daily_rate?: number;
  weekly_rate?: number;
  monthly_rate?: number;
  size?: 'compact' | 'midsize' | 'fullsize' | 'suv' | 'luxury' | string;
  features?: string[];
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface VehicleInsertData {
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  color?: string | null;
  mileage?: number | null;
  status?: VehicleStatus | null;
  description?: string | null;
  image_url?: string | null;
  rent_amount?: number | null;
  insurance_company?: string | null;
  insurance_expiry?: string | null;
  location?: string | null;
  vehicle_type_id?: string | null;
}

export interface VehicleUpdateData {
  make?: string;
  model?: string;
  year?: number;
  license_plate?: string;
  vin?: string;
  color?: string | null;
  mileage?: number | null;
  status?: VehicleStatus | null;
  description?: string | null;
  image_url?: string | null;
  rent_amount?: number | null;
  insurance_company?: string | null;
  insurance_expiry?: string | null;
  location?: string | null;
  vehicle_type_id?: string | null;
  updated_at?: string;
}
