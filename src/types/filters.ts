
import { LeaseStatus } from './lease-types';

/**
 * Base interface for filter objects
 */
export interface BaseFilters {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Agreement filters
 */
export interface AgreementFilters extends BaseFilters {
  status?: LeaseStatus[];
  date?: [Date | null, Date | null];
  vehicleId?: string;
  customerId?: string;
}

/**
 * Customer filters
 */
export interface CustomerFilters extends BaseFilters {
  status?: string[];
  nationality?: string;
}

/**
 * Vehicle filters
 */
export interface VehicleFilters extends BaseFilters {
  status?: string[];
  make?: string;
  model?: string;
  year?: number;
  vehicleType?: string;
}

/**
 * Payment filters
 */
export interface PaymentFilters extends BaseFilters {
  status?: string[];
  agreementId?: string;
  customerId?: string;
  dateRange?: [Date | null, Date | null];
  amountRange?: [number | null, number | null];
}

/**
 * Traffic fine filters
 */
export interface TrafficFineFilters extends BaseFilters {
  status?: string[];
  licensePlate?: string;
  violationDateRange?: [Date | null, Date | null];
}

/**
 * Legal case filters
 */
export interface LegalCaseFilters extends BaseFilters {
  caseType?: string[];
  status?: string[];
  priority?: string[];
  assignedTo?: string;
  customerId?: string;
}
