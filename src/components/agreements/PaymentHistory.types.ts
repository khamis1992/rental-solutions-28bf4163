
export interface ExtendedPayment {
  id: string;
  lease_id: string;
  amount: number;
  amount_paid: number;
  balance: number;
  payment_date: string;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at?: string;
  original_due_date?: string;
  due_date?: string;
  is_recurring?: boolean;
  type?: string;
  days_overdue?: number;
  late_fine_amount?: number;
  processing_fee?: number;
  processed_by?: string;
}

export interface PaymentHistoryProps {
  payments: ExtendedPayment[] | null | undefined;
  isLoading: boolean;
  rentAmount?: number | null;
  contractAmount?: number | null;
  leaseStartDate?: string | null;
  leaseEndDate?: string | null;
  onPaymentDeleted: () => void;
  onPaymentUpdated: (payment: Partial<ExtendedPayment>) => Promise<void>;
  onRecordPayment?: (payment: Partial<ExtendedPayment>) => void;
  onDelete?: (payment: ExtendedPayment) => void;
  onEdit?: (payment: ExtendedPayment) => void;
}
