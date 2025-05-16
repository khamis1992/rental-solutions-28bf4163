
import { DbId, PaymentStatus } from '@/types/database-common';

export interface Payment {
  id: string;
  lease_id: string;  // Make this required to match other Payment interfaces
  amount: number;
  payment_date?: string | null;
  due_date?: string | null;
  status: PaymentStatus | string; // Allow string for backward compatibility
  payment_method?: string;
  reference_number?: string | null;
  transaction_id?: string | null;
  notes?: string;
  type?: string;
  days_overdue?: number;
  late_fine_amount?: number;
  description?: string;
  amount_paid?: number;
  balance?: number;
  original_due_date?: string | null;
}
