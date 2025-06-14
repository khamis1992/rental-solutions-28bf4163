import { Database } from './database.types';
import { UnifiedPaymentStatus } from './status.types';
import { isErrorResponse as isStandardErrorResponse } from '../types/error.types';
import { DbId } from './database-common';

// Database types
export type Payment = Database['public']['Tables']['unified_payments']['Row'];
export type PaymentInsert = Database['public']['Tables']['unified_payments']['Insert'];
export type PaymentUpdate = Database['public']['Tables']['unified_payments']['Update'];

// Payment status and type definitions
export type PaymentStatus = 'pending' | 'completed' | 'partially_paid' | 'overdue' | 'cancelled' | 'voided';
export type PaymentType = 'rent' | 'deposit' | 'fine' | 'maintenance' | 'other';

export interface SpecialPaymentOptions {
  notes?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  includeLatePaymentFee?: boolean;
  isPartialPayment?: boolean;
  paymentType?: string;
  targetPaymentId?: string;
  type: PaymentType;
  description?: string;
  transaction_id?: string;
}

export interface PaymentMetrics {
  total_paid: number;
  total_due: number;
  total_overdue: number;
  next_payment_date: Date | null;
  days_overdue: number;
  late_fine_amount: number;
}

export interface PaymentRecord {
  id: string;
  lease_id: string;
  amount: number;
  amount_paid: number | null;
  balance: number | null;
  payment_date: Date | null;
  payment_method: string | null;
  reference_number: string | null;
  description: string | null;
  status: UnifiedPaymentStatus;
  type: string | null;
  days_overdue: number | null;
  late_fine_amount: number | null;
  original_due_date: Date | null;
  payment_reference: string | null;
  created_at: Date;
  updated_at: Date;
}

export function isPaymentRecord(value: unknown): value is PaymentRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as PaymentRecord;
  return (
    typeof record.id === 'string' &&
    typeof record.lease_id === 'string' &&
    typeof record.amount === 'number' &&
    (record.amount_paid === null || typeof record.amount_paid === 'number') &&
    (record.balance === null || typeof record.balance === 'number') &&
    (record.payment_date === null || record.payment_date instanceof Date) &&
    (record.payment_method === null || typeof record.payment_method === 'string') &&
    (record.reference_number === null || typeof record.reference_number === 'string') &&
    (record.description === null || typeof record.description === 'string') &&
    typeof record.status === 'string' &&
    (record.type === null || typeof record.type === 'string') &&
    (record.days_overdue === null || typeof record.days_overdue === 'number') &&
    (record.late_fine_amount === null || typeof record.late_fine_amount === 'number') &&
    (record.original_due_date === null || record.original_due_date instanceof Date) &&
    (record.payment_reference === null || typeof record.payment_reference === 'string') &&
    record.created_at instanceof Date &&
    record.updated_at instanceof Date
  );
}

// Re-export the standardized error response type guard
export const isErrorResponse = isStandardErrorResponse;

// Rename Payment interface to PaymentDetails
export interface PaymentDetails {
  id: string;
  agreement_id: string;
  amount: number;
  type: PaymentType;
  status: PaymentStatus;
  due_date: string;
  paid_date?: string;
  payment_method?: string;
  transaction_id?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentSchedule {
  id: string;
  agreement_id: string;
  payment_id: string;
  due_date: string;
  amount: number;
  status: PaymentStatus;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentFilterParams {
  agreementId?: string;
  status?: PaymentStatus;
  type?: PaymentType;
  startDate?: string;
  endDate?: string;
}

export interface PaymentScheduleFilterParams {
  agreementId?: string;
  status?: PaymentStatus;
  startDate?: string;
  endDate?: string;
}
