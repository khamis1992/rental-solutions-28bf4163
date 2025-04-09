export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  color?: string | null;
  mileage?: number | null;
  description?: string | null;
  location?: string | null;
  imageUrl?: string | null;
  insuranceCompany?: string | null;
  insuranceExpiry?: string | null;
  rentAmount?: number | null;
  status: string;
  vehicleTypeId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  fuelLevel?: number | null;
  transmission?: string | null;
  fuelType?: string | null;
  dailyRate?: number | null;
  lastServiced?: string | null;
  nextServiceDue?: string | null;
  features?: string[] | null;
  notes?: string | null;
  category?: string | null;
  vehicle_types?: VehicleType | null;
}

export interface VehicleType {
  id: string;
  name: string;
  size: 'compact' | 'midsize' | 'fullsize' | 'truck' | 'van' | 'suv';
  daily_rate: number;
  weekly_rate?: number;
  monthly_rate?: number;
  description?: string;
  features?: string[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface VehicleFilterParams {
  status?: string;
  make?: string;
  model?: string;
  vehicle_type_id?: string;
  location?: string;
  year?: number;
  search?: string;
}

export interface VehicleFormData {
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  color?: string | null;
  mileage?: number | null;
  description?: string | null;
  location?: string | null;
  insurance_company?: string | null;
  insurance_expiry?: string | null;
  rent_amount?: number | null;
  status?: string;
  vehicle_type_id?: string;
  image?: File | null;
}

export interface VehicleInsertData {
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  color?: string | null;
  mileage?: number | null;
  description?: string | null;
  location?: string | null;
  insurance_company?: string | null;
  insurance_expiry?: string | null;
  rent_amount?: number | null;
  status: string;
  vehicle_type_id?: string | null;
  image_url?: string | null;
}

export interface VehicleUpdateData {
  make?: string;
  model?: string;
  year?: number;
  license_plate?: string;
  vin?: string;
  color?: string | null;
  mileage?: number | null;
  description?: string | null;
  location?: string | null;
  insurance_company?: string | null;
  insurance_expiry?: string | null;
  rent_amount?: number | null;
  status?: string;
  vehicle_type_id?: string | null;
  image_url?: string | null;
}

export interface DatabaseVehicleRecord {
  id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  color: string | null;
  mileage: number | null;
  description: string | null;
  location: string | null;
  image_url: string | null;
  insurance_company: string | null;
  insurance_expiry: string | null;
  rent_amount: number | null;
  status: string;
  vehicle_type_id: string | null;
  created_at: string;
  updated_at: string;
  fuel_level: number | null;
  transmission: string | null;
  fuel_type: string | null;
  daily_rate: number | null;
  last_serviced: string | null;
  next_service_due: string | null;
  features: string[] | null;
  notes: string | null;
  category: string | null;
  vehicle_types?: DatabaseVehicleType | null;
}

export interface DatabaseVehicleType {
  id: string;
  name: string;
  size: 'compact' | 'mid_size' | 'full_size' | 'truck' | 'van' | 'suv';
  daily_rate: number;
  weekly_rate?: number;
  monthly_rate?: number;
  description?: string;
  features?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export enum VehicleStatus {
  AVAILABLE = 'available',
  RENTED = 'rented',
  MAINTENANCE = 'maintenance',
  RESERVED = 'reserved', // UI shows as 'reserved' but stored as 'reserve' in the DB
  RETIRED = 'retired'
}

export type DatabaseVehicleStatus = 'available' | 'rented' | 'maintenance' | 'reserve' | 'retired';
