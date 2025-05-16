
import { Database } from '@/types/database.types';
import { DbId, PaymentStatus } from '@/types/database-common';

export interface Payment {
  id: DbId;
  amount: number;
  payment_date?: string | null;
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
  due_date?: string | null;
  include_late_fee?: boolean;
  is_partial?: boolean;
}

export type DbPayment = Database['public']['Tables']['unified_payments']['Row'];

export interface PaymentHistoryProps {
  payments?: Payment[];
  isLoading?: boolean;
  rentAmount?: number | null;
  contractAmount?: number | null;
  onPaymentDeleted?: (paymentId: string) => void;
  onPaymentUpdated?: (payment: Partial<Payment>) => Promise<boolean | void>;
  leaseStartDate?: string | Date | null;
  leaseEndDate?: string | Date | null;
  onRecordPayment?: (payment: Partial<Payment>) => Promise<boolean>;
  leaseId?: DbId;
  onPaymentAdded?: () => void;
  showAnalytics?: boolean;
  onEditPayment?: (payment: Payment) => void;
  depositPaid?: boolean;
  depositAmount?: number;
}
