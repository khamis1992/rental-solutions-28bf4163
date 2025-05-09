
export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  color?: string;
  status?: string;
  description?: string;
  vin?: string;
  mileage?: number;
  rent_amount?: number;
  vehicle_type_id?: string;
  image_url?: string;
  vehicle_types?: {
    id: string;
    name: string;
    description?: string;
    daily_rate: number;
    [key: string]: any;
  };
  created_at?: string;
  updated_at?: string;
}

export interface VehicleFilterParams {
  status?: string;
  statuses?: string[];
  make?: string;
  model?: string;
  year?: number | null;
  minYear?: number | null;
  maxYear?: number | null;
  searchTerm?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  location?: string;
  vehicle_type_id?: string;
  [key: string]: any;
}

export interface VehicleGridProps {
  filter?: {
    statuses?: string[];
    [key: string]: any;
  };
}
