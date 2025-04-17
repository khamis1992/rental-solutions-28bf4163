
export interface DatabaseVehicleRecord {
  id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  color?: string | null;
  image_url?: string | null;
  mileage?: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  description?: string | null;
  location?: string | null;
  insurance_company?: string | null;
  insurance_expiry?: string | null;
  rent_amount?: number | null;
  vehicle_type_id?: string | null;
  vehicle_types?: DatabaseVehicleType;
  // Add other fields as needed
}

export interface DatabaseVehicleType {
  id: string;
  name: string;
  size: string;
  daily_rate: number;
  weekly_rate?: number;
  monthly_rate?: number;
  description?: string;
  features?: any[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VehicleType {
  id: string;
  name: string;
  size: string;
  daily_rate: number;
  weekly_rate?: number;
  monthly_rate?: number;
  description?: string;
  features?: any[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VehicleInsertData {
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  color?: string | null;
  image_url?: string | null;
  mileage?: number | null;
  status?: string;
  description?: string | null;
  location?: string | null;
  insurance_company?: string | null;
  insurance_expiry?: string | null;
  rent_amount?: number | null;
  vehicle_type_id?: string | null;
}

export interface VehicleUpdateData {
  make?: string;
  model?: string;
  year?: number;
  license_plate?: string;
  vin?: string;
  color?: string | null;
  image_url?: string | null;
  mileage?: number | null;
  status?: string;
  description?: string | null;
  location?: string | null;
  insurance_company?: string | null;
  insurance_expiry?: string | null;
  rent_amount?: number | null;
  vehicle_type_id?: string | null;
  updated_at?: string;
}
