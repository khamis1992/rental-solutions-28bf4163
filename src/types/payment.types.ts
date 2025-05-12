
import { Database } from './database.types';
import { DbId, PaymentStatus } from '@/types/database-common';

export type PaymentRow = Database['public']['Tables']['unified_payments']['Row'];
export type PaymentInsert = Database['public']['Tables']['unified_payments']['Insert'];
export type PaymentUpdate = Database['public']['Tables']['unified_payments']['Update'];

// Define the Payment interface that can be used throughout the application
export interface Payment {
  id: DbId;
  amount: number;
  amount_paid?: number;
  payment_date?: string | null;
  due_date?: string | null;
  status: PaymentStatus;
  lease_id?: DbId;
  type?: string;
  description?: string;
  payment_method?: string;
  transaction_id?: string;
  late_fine_amount?: number;
  days_overdue?: number;
  balance?: number;
  next_payment_date?: string | null;
  reference_number?: string;
  notes?: string;
  original_due_date?: string | null;
}

export interface PaymentMetrics {
  sent: number;
  opened: number;
  clicked: number;
  delivered: number;
  conversion: number;
}
