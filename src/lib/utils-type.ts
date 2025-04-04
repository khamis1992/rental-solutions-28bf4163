
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
  customer_name?: string;
  license_plate?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: string | number;
  customers?: any;
  vehicles?: any;
  created_at?: string | Date;
  updated_at?: string | Date;
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
    customer_name: row.customer_name || (row.customers?.full_name || 'Unknown'),
    license_plate: row.license_plate || (row.vehicles?.license_plate || 'Unknown'),
    vehicle_make: row.vehicle_make || (row.vehicles?.make || 'Unknown'),
    vehicle_model: row.vehicle_model || (row.vehicles?.model || 'Unknown'),
    vehicle_year: row.vehicle_year || (row.vehicles?.year || 'Unknown'),
    customers: row.customers,
    vehicles: row.vehicles,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
