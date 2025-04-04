
import { Database } from '@/integrations/supabase/types';

/**
 * Type utility file to handle complex types and prevent "excessively deep" type instantiation errors
 */

// Simplified lease/agreement type to avoid deep instantiation issues
export type SimplifiedLeaseType = {
  id: string;
  customer_id: string;
  vehicle_id: string;
  start_date: string | Date;
  end_date: string | Date;
  status: string;
  agreement_number?: string;
  total_amount?: number;
  rent_amount?: number;
  deposit_amount?: number;
  daily_late_fee?: number;
  terms_accepted?: boolean;
  signature_url?: string;
  notes?: string;
  agreement_duration?: string;
  additional_drivers?: string[];
  // Add more basic properties as needed
};

// Type assertion function to safely cast database types
export function asSimplifiedLease(obj: any): SimplifiedLeaseType {
  return obj as SimplifiedLeaseType;
}

// Custom map function to map database rows to application types safely
export function mapDatabaseRowToLease<T extends Record<string, any>>(row: T): SimplifiedLeaseType {
  return {
    id: row.id,
    customer_id: row.customer_id,
    vehicle_id: row.vehicle_id,
    start_date: row.start_date,
    end_date: row.end_date,
    status: row.status,
    agreement_number: row.agreement_number,
    total_amount: row.total_amount,
    rent_amount: row.rent_amount,
    deposit_amount: row.deposit_amount,
    daily_late_fee: row.daily_late_fee,
    terms_accepted: row.terms_accepted,
    signature_url: row.signature_url,
    notes: row.notes,
    agreement_duration: row.agreement_duration,
    additional_drivers: row.additional_drivers,
  };
}
