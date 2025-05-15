
import { DbId } from '@/types/database-common';

// Status options for traffic fines
export enum TrafficFineStatus {
  PENDING = 'pending',
  PAID = 'paid',
  DISPUTED = 'disputed',
  OVERDUE = 'overdue',
  COMPLETED = 'completed',
  WAIVED = 'waived'
}

// Base interface for TrafficFines
export interface TrafficFine {
  id: string;
  license_plate?: string;
  fine_location?: string;
  fine_amount: number;
  payment_status: string;
  validation_status?: string;
  violation_date?: string;
  payment_date?: string;
  violation_charge?: string;
  violation_points?: number;
  violation_number?: string;
  serial_number?: string;
  lease_id?: string;
  vehicle_id?: string;
  customer_id?: string;
  agreement_id?: string;
  payment_reference?: string;
  disputed_reason?: string;
  disputed_date?: string;
  created_at?: string;
  updated_at?: string;
}

// For paginated responses
export interface PaginatedTrafficFineResult {
  data: TrafficFine[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// For insertions
export interface TrafficFineInsert extends Omit<TrafficFine, 'id'> {
  id?: string;
}

// For API parameters
export interface TrafficFineParams {
  vehicleId?: string;
  agreementId?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

// For fine payment
export interface TrafficFinePaymentDetails {
  payment_date?: string;
  payment_method?: string;
  reference_number?: string;
  amount?: number;
  notes?: string;
}
