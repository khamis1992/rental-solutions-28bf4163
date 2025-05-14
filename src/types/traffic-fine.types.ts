/**
 * Traffic Fines Types
 * Type definitions for traffic violations and fines
 */
import { DbId } from './database-common';

/**
 * Status of a traffic fine
 */
export enum TrafficFineStatus {
  PENDING = 'pending',
  PAID = 'paid',
  DISPUTED = 'disputed',
  OVERDUE = 'overdue',
  WAIVED = 'waived',
  BILLED_TO_CUSTOMER = 'billed_to_customer',
  PROCESSING = 'processing'
}

/**
 * Types of traffic violations
 */
export enum ViolationType {
  SPEEDING = 'speeding',
  PARKING = 'parking',
  RED_LIGHT = 'red_light',
  NO_PERMIT = 'no_permit',
  IMPROPER_LANE_CHANGE = 'improper_lane_change',
  OTHER = 'other'
}

/**
 * Traffic fine record
 */
export interface TrafficFine {
  id: DbId;
  vehicle_id: DbId;
  license_plate: string;
  violation_date: string;
  violation_type: ViolationType;
  violation_location?: string;
  fine_amount: number;
  status: TrafficFineStatus;
  due_date?: string;
  payment_date?: string;
  reference_number?: string;
  issuing_authority?: string;
  driver_name?: string;
  notes?: string;
  agreement_id?: DbId;
  customer_id?: DbId;
  created_at?: string;
  updated_at?: string;
  image_url?: string;
  payment_receipt_url?: string;
  disputed_reason?: string;
  disputed_date?: string;
  disputed_status?: 'pending' | 'approved' | 'rejected';
}

/**
 * Traffic fine validation record
 */
export interface TrafficFineValidation {
  id: DbId;
  license_plate: string;
  validation_date: string;
  result: 'clean' | 'found' | 'error';
  status: 'pending' | 'processed' | 'failed';
  fine_id?: DbId;
  batch_id?: string;
  created_at?: string;
  error_message?: string;
  validated_by?: string;
  source?: string;
}

/**
 * Paginated traffic fine result
 */
export interface PaginatedTrafficFineResult {
  data: TrafficFine[];
  count: number;
}

/**
 * For creating new traffic fine records
 */
export type TrafficFineInsert = Omit<TrafficFine, 'id' | 'created_at' | 'updated_at'>;

/**
 * For updating traffic fine records
 */
export type TrafficFineUpdate = Partial<TrafficFine>;

/**
 * Traffic fine statistics
 */
export interface TrafficFineStatistics {
  totalCount: number;
  totalAmount: number;
  paidCount: number;
  paidAmount: number;
  pendingCount: number;
  pendingAmount: number;
  overdueCount: number;
  overdueAmount: number;
  byVehicleType: Array<{type: string, count: number, amount: number}>;
  byViolationType: Array<{type: string, count: number, amount: number}>;
}
