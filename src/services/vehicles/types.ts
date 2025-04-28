
import { TableRow } from '@/lib/database/types';
import { DbId, VehicleId, VehicleStatus } from '@/types/database-common';

export type Vehicle = TableRow<'vehicles'>;

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
  search?: string;
  [key: string]: any;
}

export interface VehicleWithMaintenance extends Vehicle {
  maintenance: any[];
}

export interface VehicleWithType extends Vehicle {
  vehicleType?: {
    id: string;
    name: string;
    daily_rate?: number;
    weekly_rate?: number;
    monthly_rate?: number;
  };
}

export interface VehicleType {
  id: string;
  name: string;
  size?: string;
  daily_rate?: number;
  weekly_rate?: number;
  monthly_rate?: number;
  description?: string;
  features?: string[];
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface VehicleUtilizationMetrics {
  totalDays: number;
  daysRented: number;
  utilizationRate: number;
  leasesCount: number;
}
