

export type VehicleSize = 'compact' | 'midsize' | 'fullsize' | 'suv' | 'van' | 'luxury';

export interface DatabaseVehicleType {
  id: string;
  name: string;
  size: string;
  daily_rate: number;
  weekly_rate?: number;
  monthly_rate?: number;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  features?: any; // This will handle the Json type
}

export interface DatabaseVehicleRecord {
  id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  color?: string;
  status?: DatabaseVehicleStatus;
  mileage?: number;
  image_url?: string;
  description?: string;
  location?: string;
  updated_at: string;
  created_at: string;
  insurance_company?: string;
  insurance_expiry?: string;
  device_type?: string;
  rent_amount?: number;
  vehicle_type_id?: string;
  registration_number?: string;
  vehicle_types?: DatabaseVehicleType;
  is_test_data?: boolean;
}

// Define the statuses for both the application and database
export type VehicleStatus = 'available' | 'rented' | 'reserved' | 'maintenance' | 'police_station' | 'accident' | 'stolen' | 'retired';
export type DatabaseVehicleStatus = 'available' | 'rented' | 'reserve' | 'maintenance' | 'police_station' | 'accident' | 'stolen' | 'retired';

