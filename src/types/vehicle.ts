
export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  color: string | null;
  vin: string;
  status: 'available' | 'rented' | 'maintenance' | 'retired' | 'police_station' | 'accident' | 'stolen' | 'reserved';
  mileage: number | null;
  image_url: string | null;
  description: string | null;
  location: string | null;
  insurance_company: string | null;
  insurance_expiry: string | null;
  rent_amount: number | null;
  vehicle_type_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleFormData {
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  color?: string;
  status?: 'available' | 'rented' | 'maintenance' | 'retired' | 'police_station' | 'accident' | 'stolen' | 'reserved';
  mileage?: number;
  description?: string;
  location?: string;
  insurance_company?: string;
  insurance_expiry?: string;
  rent_amount?: number;
  vehicle_type_id?: string;
}
