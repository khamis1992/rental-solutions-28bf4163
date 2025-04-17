
export type VehicleStatus = 
  'available' | 
  'rented' | 
  'reserved' | 
  'maintenance' | 
  'police_station' | 
  'accident' | 
  'stolen' | 
  'retired';

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year?: number;
  license_plate: string;
  licensePlate?: string; // Alternative property name
  color?: string;
  vin?: string;
  status?: VehicleStatus | string;
  insurance_company?: string;
  insurance_policy?: string;
  insurance_expiry?: string;
  documents_verified?: boolean;
  image_url?: string;
  vehicle_type_id?: string;
  created_at?: string;
  updated_at?: string;
  vehicleType?: VehicleType;
  mileage?: number;
  rent_amount?: number;
  dailyRate?: number;
  location?: string;
  currentCustomer?: string;
}

export interface VehicleListItem {
  id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  status: string;
}

export interface VehicleFilterParams {
  status?: string;
  statuses?: string[];
  make?: string;
  model?: string;
  year?: string;
  search?: string;
  location?: string;
  vehicle_type_id?: string;
}

export interface VehicleFormData {
  make: string;
  model: string;
  year?: number;
  license_plate: string;
  color?: string;
  vin?: string;
  status?: VehicleStatus;
  insurance_company?: string;
  insurance_policy?: string;
  insurance_expiry?: string;
  vehicle_type_id?: string;
  mileage?: number;
  rent_amount?: number;
  location?: string;
}

export type VehicleInsertData = Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>;
export type VehicleUpdateData = Partial<VehicleInsertData>;

export interface VehicleType {
  id: string;
  name: string;
  size?: 'small' | 'midsize' | 'fullsize' | 'luxury' | 'suv' | 'van';
  daily_rate?: number;
  weekly_rate?: number;
  monthly_rate?: number;
  description?: string;
  features?: string[];
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DatabaseVehicleRecord extends Vehicle {
  vehicle_types?: DatabaseVehicleType;
  status: DatabaseVehicleStatus | null;
}

export interface DatabaseVehicleType {
  id: string;
  name: string;
  size?: string;
  daily_rate?: number;
  weekly_rate?: number;
  monthly_rate?: number;
  description?: string;
  features?: string[] | string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type DatabaseVehicleStatus = 'available' | 'rented' | 'reserve' | 'maintenance' | 'police_station' | 'accident' | 'stolen' | 'retired';
