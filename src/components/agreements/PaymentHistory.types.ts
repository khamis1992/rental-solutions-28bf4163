
export interface Payment {
  id: string;
  lease_id: string;
  amount: number;
  payment_date: string | null;
  status: string;
  payment_method?: string;
  transaction_id?: string;
  description?: string;
  notes?: string;
  reference_number?: string;
  amount_paid?: number;
  balance?: number;
  late_fine_amount?: number;
  days_overdue?: number;
  original_due_date?: string | null;
}

export interface PaymentHistoryProps {
  agreementId: string;
  payments?: Payment[];
  isLoading?: boolean;
  rentAmount?: number | null;
  contractAmount?: number | null;
  onPaymentDeleted?: () => void;
  onPaymentUpdated?: (updatedPayment: Partial<Payment>) => Promise<void>;
  onRecordPayment?: (payment: Partial<Payment>) => void;
  leaseStartDate?: string | Date | null;
  leaseEndDate?: string | Date | null;
}
