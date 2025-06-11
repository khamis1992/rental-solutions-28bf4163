
export type VehicleStatus = 
  | 'available'
  | 'rented'
  | 'maintenance'
  | 'police_station'
  | 'accident'
  | 'stolen'
  | 'reserved'
  | 'attention'
  | 'critical';

export interface Vehicle {
  id: string;
  make?: string;
  model?: string;
  year?: number;
  license_plate?: string;
  vin?: string;
  color?: string;
  status?: VehicleStatus;
  attention_needed_notes?: string;
  engine_number?: string;
  model_number?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export type VehicleId = string;
