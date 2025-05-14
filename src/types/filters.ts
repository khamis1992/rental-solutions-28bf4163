
import { LeaseStatus } from './lease-types';

export interface AgreementFilters {
  status?: LeaseStatus[];
  customerId?: string;
  vehicleId?: string;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
  agreementNumber?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface VehicleFilters {
  status?: string[];
  make?: string;
  model?: string;
  year?: number;
  searchTerm?: string;
  licenseplate?: string;
  page?: number;
  limit?: number;
}

export interface CustomerFilters {
  status?: string[];
  searchTerm?: string;
  email?: string;
  phone?: string;
  page?: number;
  limit?: number;
}

export interface PaymentFilters {
  status?: string[];
  startDate?: Date;
  endDate?: Date;
  leaseId?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
}
