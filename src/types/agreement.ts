
/**
 * Enum defining possible agreement statuses in the system
 */
export enum AgreementStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
  OVERDUE = 'overdue',
  RESERVED = 'reserved',
  MAINTENANCE = 'maintenance',
  UNKNOWN = 'unknown'
}

/**
 * Enum defining agreement types
 */
export enum AgreementType {
  SHORT_TERM = 'short_term',
  LEASE_TO_OWN = 'lease_to_own'
}

/**
 * Interface for agreement data
 */
export interface Agreement {
  id: string;
  customer_id: string;
  vehicle_id: string;
  start_date: string | null;
  end_date: string | null;
  agreement_type: string;
  agreement_number: string;
  status: string;
  total_amount: number;
  monthly_payment: number;
  agreement_duration: any;
  notes: string;
  deposit_amount: number;
  rent_amount: number;
  daily_late_fee: number;
  signature_url?: string | null;
  created_at: string;
  updated_at: string;
}
