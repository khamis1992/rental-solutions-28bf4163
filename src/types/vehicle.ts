
export type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'retired' | 'police_station' | 'accident' | 'stolen' | 'reserved';

export interface Vehicle {
  id: string;
  license_plate: string;
  make: string;
  model: string;
  year: number;
  color?: string | null;
  vin: string;
  mileage?: number | null;
  status?: VehicleStatus | null;
  description?: string | null;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
  rent_amount?: number | null;
  insurance_company?: string | null;
  insurance_expiry?: string | null;
  location?: string | null;
  vehicleType?: {
    id: string;
    name: string;
    description?: string;
    daily_rate?: number;
  };
  dailyRate?: number;
}

export interface VehicleFilterParams {
  status?: string;
  make?: string;
  model?: string;
  year?: number;
  search?: string;
  location?: string;
  vehicle_type_id?: string;
}

export type DatabaseVehicleStatus = 'available' | 'rented' | 'maintenance' | 'retired' | 'police_station' | 'accident' | 'stolen' | 'reserved';
