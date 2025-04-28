
export interface ExtendedPayment {
  id: string;
  lease_id: string;
  amount: number;
  amount_paid: number;
  balance: number;
  payment_date: string | null;
  payment_method: string | null;
  description: string | null;
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
  reference_number?: string;
  notes?: string;
}

export interface PaymentFormValues {
  amount?: number;
  amount_paid?: number;
  balance?: number;
  payment_date?: string;
  due_date?: string;
  payment_method?: string;
  description?: string;
  status?: string;
  reference_number?: string;
  notes?: string;
}

export interface PaymentHistoryProps {
  agreementId: string;
  isLoading?: boolean;
  onPaymentDeleted: () => void;
  onPaymentUpdated: () => Promise<void>;
  onEdit: (payment: ExtendedPayment) => void;
  onDelete: (payment: ExtendedPayment) => void;
  rentAmount?: number | null;
  contractAmount?: number | null;
  payments?: ExtendedPayment[];
}
