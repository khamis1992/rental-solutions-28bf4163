
export type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'reserved';

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
  // Customer information for rented vehicles
  currentCustomer?: string;
}
