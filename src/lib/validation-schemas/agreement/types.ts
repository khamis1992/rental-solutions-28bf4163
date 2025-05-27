
import { z } from 'zod';

// Define agreement status enum
export type AgreementStatus = 'draft' | 'active' | 'pending' | 'closed' | 'cancelled' | 'expired';

// Define the Agreement type with terms_accepted
export interface Agreement {
  id?: string;
  agreement_number: string;
  customer_id: string;
  vehicle_id: string;
  start_date: string | Date;
  end_date: string | Date;
  rent_amount: number;
  total_amount: number;
  status: AgreementStatus;
  created_at?: string | Date;
  updated_at?: string | Date;
  daily_late_fee?: number;
  rent_due_day?: number;
  agreement_duration?: string;
  lease_duration?: string;
  initial_mileage?: number;
  agreement_type?: string;
  notes?: string;
  template_id?: string;
  processed_content?: string;
  terms_accepted?: boolean;
  deposit_amount?: number;
  additional_drivers?: string[];
  // Related data that might be included in joins
  customers?: any;
  profiles?: any;
  vehicles?: any;
}
