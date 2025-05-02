
/**
 * Vehicle data structure returned from search functions
 */
export interface VehicleData {
  id: string;
  make: string;
  model: string;
  year?: number;
  color?: string | null;
  license_plate: string;
  status: VehicleStatus;
  vehicle_types?: {
    id: string;
    name: string;
  } | null;
}
