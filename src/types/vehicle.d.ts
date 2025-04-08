
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
