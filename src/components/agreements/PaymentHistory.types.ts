
import { Database } from '@/types/database.types';
import { DbId, PaymentStatus } from '@/types/database-common';

export interface PaymentRecord {
  id: DbId;
  amount: number;
  payment_date?: string | null; // Updated to be string | null, not Date
  payment_method?: string;
  reference_number?: string | null;
  transaction_id?: string | null;
  notes?: string;
  type?: string;
  status?: PaymentStatus;
  late_fine_amount?: number;
  days_overdue?: number;
  lease_id?: DbId;
  original_due_date?: string | null;
  amount_paid?: number;
  balance?: number;
  description?: string;
  due_date?: string | null; // Updated to be string | null, not Date
  include_late_fee?: boolean;
  is_partial?: boolean;
}

export type DbPayment = Database['public']['Tables']['unified_payments']['Row'];

export interface PaymentHistoryProps {
  payments?: PaymentRecord[];
  isLoading?: boolean;
  rentAmount?: number | null;
  contractAmount?: number | null;
  onPaymentDeleted?: () => void;
  onPaymentCreated?: () => void;
  leaseStartDate?: string | Date | null;
  leaseEndDate?: string | Date | null;
  onRecordPayment?: (payment: Partial<PaymentRecord>) => void;
  onPaymentUpdated?: (payment: Partial<PaymentRecord>) => Promise<boolean | void>;
  leaseId?: DbId;
}
