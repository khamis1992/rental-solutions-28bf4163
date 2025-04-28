
import { Database } from '@/types/database.types';

export interface Payment {
  id: string;
  amount: number;
  payment_date: string | null;
  payment_method?: string;
  reference_number?: string | null; 
  notes?: string;
  type?: string;
  status?: string;
  late_fine_amount?: number;
  days_overdue?: number;
  lease_id?: string;
  original_due_date?: string | null;
  amount_paid?: number;
  balance?: number;
  description?: string;
  due_date?: string;
}

export type DbPayment = Database['public']['Tables']['unified_payments']['Row'];

export interface PaymentHistoryProps {
  payments?: Payment[];
  isLoading?: boolean;
  rentAmount?: number | null;
  contractAmount?: number | null;
  onPaymentDeleted?: () => void;
  leaseStartDate?: string | Date | null;
  leaseEndDate?: string | Date | null;
  onRecordPayment?: (payment: Partial<Payment>) => void;
  onPaymentUpdated?: (payment: Partial<Payment>) => Promise<void>;
  leaseId?: string;
}
