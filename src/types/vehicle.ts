
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
  color?: string;
  vin?: string;
  status?: string;
  insurance_company?: string;
  insurance_policy?: string;
  insurance_expiry?: string;
  documents_verified?: boolean;
  image_url?: string;
  vehicle_type_id?: string;
  created_at?: string;
  updated_at?: string;
  vehicleType?: {
    id: string;
    name: string;
    description?: string;
  };
  rent_amount?: number;
  dailyRate?: number; // For compatibility
  currentCustomer?: string; // For compatibility
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
  make?: string;
  model?: string;
  year?: string;
  search?: string;
}
