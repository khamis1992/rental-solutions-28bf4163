
import { supabase } from '@/lib/supabase';
import { DbId, LeaseId, PaymentId, VehicleId, ProfileId, TrafficFineId, LegalCaseId, MaintenanceId } from '@/types/database-common';

/**
 * Helper function to safely cast a string to a DbId
 */
export const asDbId = (id: string): DbId => id as DbId;

/**
 * Helper function to safely cast a string to a LeaseId
 */
export const asLeaseId = (id: string): LeaseId => id as LeaseId;

/**
 * Helper function to safely cast a string to a PaymentId
 */
export const asPaymentId = (id: string): PaymentId => id as PaymentId;

/**
 * Helper function to safely cast a string to a VehicleId
 */
export const asVehicleId = (id: string): VehicleId => id as VehicleId;

/**
 * Helper function to safely cast a string to a ProfileId
 */
export const asProfileId = (id: string): ProfileId => id as ProfileId;

/**
 * Helper function to safely cast a string to a TrafficFineId
 */
export const asTrafficFineId = (id: string): TrafficFineId => id as TrafficFineId;

/**
 * Helper function to safely cast a string to a LegalCaseId
 */
export const asLegalCaseId = (id: string): LegalCaseId => id as LegalCaseId;

/**
 * Helper function to safely cast a string to a MaintenanceId
 */
export const asMaintenanceId = (id: string): MaintenanceId => id as MaintenanceId;

/**
 * Adapts an agreement object to match the validation schema
 */
export function adaptAgreementForValidation(agreement: any) {
  return {
    ...agreement,
    // Ensure required fields exist with default values if needed
    total_amount: agreement.total_amount ?? 0,
  };
}

/**
 * Creates a type-safe payment update object
 */
export function createPaymentUpdate(data: {
  amount_paid?: number;
  balance?: number;
  status?: string;
  payment_date?: string;
  payment_method?: string;
  reference_number?: string;
  [key: string]: any;
}) {
  // Filter out keys that don't exist in the DB schema
  const safeData: Record<string, any> = {};
  
  if (data.amount_paid !== undefined) safeData.amount_paid = data.amount_paid;
  if (data.balance !== undefined) safeData.balance = data.balance;
  if (data.status !== undefined) safeData.status = data.status;
  if (data.payment_date !== undefined) safeData.payment_date = data.payment_date;
  if (data.payment_method !== undefined) safeData.payment_method = data.payment_method;
  // Handle reference_number specially as transaction_id in DB
  if (data.reference_number !== undefined) safeData.transaction_id = data.reference_number;
  
  return safeData;
}

/**
 * Creates a type-safe payment insert object
 */
export function createPaymentInsert(data: {
  lease_id: LeaseId;
  amount: number;
  amount_paid?: number;
  balance?: number;
  payment_date?: string;
  payment_method?: string;
  reference_number?: string | null;
  description?: string;
  status?: string;
  type?: string;
  days_overdue?: number;
  late_fine_amount?: number;
  original_due_date?: string;
  [key: string]: any;
}) {
  // Create a clean object with only valid DB fields
  const safeData: Record<string, any> = {
    lease_id: data.lease_id,
    amount: data.amount
  };
  
  if (data.amount_paid !== undefined) safeData.amount_paid = data.amount_paid;
  if (data.balance !== undefined) safeData.balance = data.balance;
  if (data.payment_date !== undefined) safeData.payment_date = data.payment_date;
  if (data.description !== undefined) safeData.description = data.description;
  if (data.status !== undefined) safeData.status = data.status;
  if (data.type !== undefined) safeData.type = data.type;
  if (data.days_overdue !== undefined) safeData.days_overdue = data.days_overdue;
  if (data.late_fine_amount !== undefined) safeData.late_fine_amount = data.late_fine_amount;
  if (data.original_due_date !== undefined) safeData.original_due_date = data.original_due_date;
  if (data.payment_method !== undefined) safeData.payment_method = data.payment_method;
  // Handle reference_number specially as transaction_id in DB
  if (data.reference_number !== undefined) safeData.transaction_id = data.reference_number;
  
  return safeData;
}

/**
 * Helper function to check if query data is valid
 */
export function isQueryDataValid<T>(data: any): data is T {
  return data !== undefined && data !== null;
}

/**
 * Extract monthly rate from a vehicle's pricing information
 */
export function extractMonthlyRate(vehicle: any): number {
  if (!vehicle) return 0;
  
  // Try to get monthly_rate directly
  if (typeof vehicle.monthly_rate === 'number') {
    return vehicle.monthly_rate;
  }
  
  // Try to parse from pricing object if it exists
  if (vehicle.pricing && typeof vehicle.pricing === 'object') {
    if (typeof vehicle.pricing.monthly_rate === 'number') {
      return vehicle.pricing.monthly_rate;
    }
  }
  
  return 0;
}
