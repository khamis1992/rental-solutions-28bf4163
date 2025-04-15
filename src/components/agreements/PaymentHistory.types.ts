
export interface Payment {
  id: string;
  amount: number;
  amount_paid: number;
  payment_date: string | null;
  payment_method: string | null;
  status: string;
  due_date?: string | null;
  description?: string | null;
  reference_number?: string | null;
  notes?: string | null;
  lease_id?: string | null;
  balance?: number;
  transaction_id?: string | null;
  original_due_date?: string | null;
}

export interface ExtendedPayment extends Omit<Payment, 'amount_paid'> {
  amount_paid?: number; // Make optional in ExtendedPayment
  balance: number; // Required in ExtendedPayment
  days_overdue?: number;
  late_fine_amount?: number;
}

export interface PaymentHistoryProps {
  agreementId?: string;
  onAddPayment?: () => void;
  payments?: Payment[];
  isLoading?: boolean;
  rentAmount?: number | null;
  onPaymentDeleted?: () => void;
  leaseStartDate?: Date;
  leaseEndDate?: Date;
}
