
import { ServiceResponse } from '../response-handler';
import { Database } from '@/types/database.types';
import { LEASE_STATUSES } from '@/types/database-common';

// Define agreement type for readability
export type Agreement = Database['public']['Tables']['leases']['Row'];

// Define types for agreement filters
export interface AgreementFilters {
  status?: string;
  vehicle_id?: string;
  customer_id?: string;
  query?: string;
  [key: string]: any;
}

// Define interface for vehicle availability check result
export interface VehicleAvailabilityResult {
  isAvailable: boolean;
  existingAgreement?: any;
  error?: string;
}

// Define interface for agreement activation result
export interface ActivationResult {
  success: boolean;
  message: string;
}

// Re-export lease statuses for convenience
export { LEASE_STATUSES };
