
export type VehicleStatus = 
  | 'available' 
  | 'rented' 
  | 'maintenance' 
  | 'reserved'
  | 'police_station'
  | 'accident'
  | 'stolen'
  | 'retired';

export interface Vehicle {
  id: string;
  license_plate: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  vin: string;
  mileage?: number;
  status?: VehicleStatus;
  dailyRate?: number;
  description?: string;
  image_url?: string;
  vehicleType?: {
    id: string;
    name: string;
    daily_rate: number;
  };
  created_at?: string;
  updated_at?: string;
  // Added fields from the code usage
  insurance_company?: string;
  insurance_expiry?: Date | string;
  location?: string;
  rent_amount?: number;
  // Customer information for rented vehicles
  currentCustomer?: string;
}

export interface VehicleFilterParams {
  status?: VehicleStatus;
  make?: string;
  model?: string;
  year?: number;
  location?: string;
  search?: string;
  vehicle_type_id?: string;
}

export interface VehicleFormData {
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  color?: string;
  mileage?: number;
  description?: string;
  status?: VehicleStatus;
  vehicle_type_id?: string;
  location?: string;
  image_url?: string;
  insurance_company?: string;
  insurance_expiry?: string;
  rent_amount?: number;
  notes?: string;
}

export interface VehicleType {
  id: string;
  name: string;
  size?: string; 
  daily_rate: number;
  weekly_rate?: number;
  monthly_rate?: number;
  description?: string;
  features?: any[];
  is_active?: boolean;
}

export type VehicleInsertData = Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>;
export type VehicleUpdateData = Partial<VehicleInsertData>;

// Supabase database types
export type DatabaseVehicleStatus = 'available' | 'rented' | 'maintenance' | 'reserve' | 'police_station' | 'accident' | 'stolen' | 'retired';

export interface DatabaseVehicleRecord {
  id: string;
  license_plate: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  vin: string;
  mileage?: number;
  status?: DatabaseVehicleStatus;
  vehicle_type_id?: string;
  description?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  rent_amount?: number;
  insurance_company?: string;
  insurance_expiry?: string;
  location?: string;
}

export interface DatabaseVehicleType {
  id: string;
  name: string;
  daily_rate: number;
  size?: string;
  description?: string;
  features?: any[];
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
}
