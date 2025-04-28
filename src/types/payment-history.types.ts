
import { DbId } from './database-common';

export interface Payment {
  id: DbId;
  amount: number;
  payment_date: string | null;
  payment_method?: string;
  reference_number?: string | null;
  transaction_id?: string | null;
  notes?: string;
  type?: string;
  status?: string;
  late_fine_amount?: number;
  days_overdue?: number;
  lease_id?: DbId;
  original_due_date?: string | null;
  amount_paid?: number;
  balance?: number;
  description?: string;
  due_date?: string;
  include_late_fee?: boolean;
  is_partial?: boolean;
}

export interface CustomerInfo {
  id: DbId;
  full_name: string;
  email?: string;
  phone_number?: string;
}

export interface VehicleInfo {
  id: DbId;
  make: string;
  model: string;
  license_plate: string;
  year: number;
  color?: string;
}
