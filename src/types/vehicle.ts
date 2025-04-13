
/**
 * Vehicle status options from the database schema
 */
export type VehicleStatus = 
  | 'available' 
  | 'rented' 
  | 'maintenance' 
  | 'retired' 
  | 'police_station' 
  | 'accident' 
  | 'stolen' 
  | 'reserved';

/**
 * Vehicle type definition
 */
export interface VehicleType {
  id: string;
  name: string;
  size: string;
  daily_rate: number;
  weekly_rate?: number;
  monthly_rate?: number;
  description?: string;
}

/**
 * Vehicle filter parameters type
 */
export interface VehicleFilterParams {
  status?: string;
  make?: string;
  model?: string;
  year?: number | null;
  minYear?: number | null;
  maxYear?: number | null;
  searchTerm?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}
