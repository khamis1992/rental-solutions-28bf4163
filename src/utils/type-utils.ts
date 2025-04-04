
/**
 * Utility type to flatten deeply nested object types
 */
export type FlattenType<T> = T extends object ? {
  [K in keyof T]: T[K]
} : T;

/**
 * Define a base type for agreement
 */
export interface BaseAgreement {
  id: string;
  customer_id: string;
  vehicle_id: string;
  start_date?: string | null;
  end_date?: string | null;
  agreement_type?: string;
  agreement_number?: string;
  status?: string;
  total_amount?: number;
  monthly_payment?: number;
  agreement_duration?: any;
  customer_name?: string;
  license_plate?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  created_at?: string;
  updated_at?: string;
  signature_url?: string | null;
  deposit_amount?: number;
  notes?: string;
  customers?: any;
  vehicles?: any;
  rent_amount?: number;
  daily_late_fee?: number;
}
