
// Import UUID type from our database helpers
import { UUID } from '@/utils/database-type-helpers';

export interface Payment {
  id: UUID;
  amount: number;
  amount_paid?: number;
  balance?: number;
  payment_date: string | null;
  due_date?: string | null;
  status?: string;
  payment_method?: string | null;
  description?: string | null;
  type?: string;
  created_at?: string;
  updated_at?: string;
  late_fine_amount?: number;
  days_overdue?: number;
  original_due_date?: string | null;
  transaction_id?: string | null;
  import_reference?: string | null;
  is_recurring?: boolean;
  recurring_interval?: any | null;
  next_payment_date?: string | null;
  lease_id?: UUID;
  security_deposit_id?: UUID | null;
  invoice_id?: UUID | null;
}
