
import { AgreementStatus } from './agreement-types';

export interface AgreementFilters {
  status?: AgreementStatus | string | undefined;
  customer?: string | undefined;
  dateRange?: [Date | null, Date | null] | undefined;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  vehicleId?: string;
  searchTerm?: string;
  [key: string]: any;
}

export interface VehicleFilterParams {
  status?: string[];
  make?: string[];
  model?: string[];
  year?: number[];
  searchTerm?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface CustomerFilterParams {
  status?: string[];
  searchTerm?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}
