
export type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'retired';

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  status: VehicleStatus;
  imageUrl: string;
  location?: string;
  fuelLevel?: number;
  mileage?: number;
  vin?: string;
  lastServiced?: string; // ISO date string
  nextServiceDue?: string; // ISO date string
  dailyRate?: number;
  color?: string;
  transmission?: 'automatic' | 'manual';
  fuelType?: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  category?: 'economy' | 'compact' | 'midsize' | 'fullsize' | 'luxury' | 'suv' | 'truck' | 'van';
  features?: string[];
  notes?: string;
}
