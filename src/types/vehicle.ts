export type DatabaseVehicleStatus = "available" | "rented" | "reserve" | "maintenance" | "police_station" | "accident" | "stolen" | "retired";
export type VehicleStatus = "available" | "rented" | "reserved" | "maintenance" | "police_station" | "accident" | "stolen" | "retired";
export type VehicleSize = "compact" | "midsize" | "fullsize" | "suv" | "van" | "truck" | "luxury";

export interface VehicleType {
  id: string;
  name: string;
  description: string;
  size: string;
  daily_rate: number;
  is_active: boolean;
  features: string[];
  created_at: string;
  updated_at: string;
  weekly_rate?: number;
  monthly_rate?: number;
}

export interface DatabaseVehicleType {
  id: string;
  name: string;
  description?: string;
  size: string;
  daily_rate: number;
  is_active: boolean;
  features?: string[];
  created_at?: string;
  updated_at?: string;
  weekly_rate?: number;
  monthly_rate?: number;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  status: VehicleStatus;
  image_url?: string;
  color?: string;
  mileage?: number;
  location?: string;
  vehicleType?: VehicleType | null;
  created_at: string;
  updated_at: string;
  description?: string;
  insurance_company?: string;
  insurance_expiry?: string;
  rent_amount?: number;
  vehicle_type_id?: string;
  features?: string[];
  notes?: string;
  dailyRate?: number;
  licensePlate?: string;
  imageUrl?: string;
}

export interface VehicleFilterParams {
  status?: VehicleStatus;
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
  color?: string;
  status?: VehicleStatus;
  mileage?: number;
  description?: string;
  location?: string;
  insurance_company?: string;
  insurance_expiry?: string;
  rent_amount?: number;
  vehicle_type_id?: string;
  image?: File;
  registration_number?: string;
}

export interface VehicleInsertData {
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  color?: string;
  status?: DatabaseVehicleStatus;
  mileage?: number;
  description?: string;
  location?: string;
  insurance_company?: string;
  insurance_expiry?: string;
  rent_amount?: number;
  vehicle_type_id?: string;
  registration_number?: string;
  image_url?: string;
}

export type VehicleUpdateData = VehicleInsertData;
