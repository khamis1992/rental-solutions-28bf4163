
export interface Vehicle {
  id: string;
  make: string;
  model: string;
  license_plate: string;
  year: number;
  type?: string;
  status?: string;
  mileage?: number;
  color?: string;
  vin?: string;
}

export type VehicleFilterParams = {
  status?: string;
  make?: string;
  type?: string;
  location?: string;
  year?: number;
  [key: string]: string | number | undefined;
};

export type VehicleStatus = 'available' | 'rented' | 'reserved' | 'maintenance' | 'police_station' | 'accident' | 'stolen' | 'retired' | string;
