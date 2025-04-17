
// Define the core Payment interface with all properties used across components
export interface Payment {
  id: string;
  lease_id: string;
  amount: number;
  amount_paid: number;
  balance: number;
  payment_date: string | null;
  due_date: string | null;
  status: string;
  payment_method: string | null;
  description: string | null;
  type: string;
  created_at: string;
  updated_at: string;
  late_fine_amount?: number;
  days_overdue?: number;
  original_due_date?: string | null;
  reference_number?: string | null;
  notes?: string | null;
  transaction_id?: string | null;
}

// Extended version with additional properties for specific components
export interface ExtendedPayment extends Payment {
  import_reference?: string | null;
  reconciliation_status?: string | null;
  reconciliation_date?: string | null;
  import_batch_id?: string | null;
  next_payment_date?: string | null;
  invoice_id?: string | null;
  security_deposit_id?: string | null;
}

// Props for the payment list component
export interface PaymentListProps {
  leaseId: string;
  onPaymentUpdated?: () => void;
}

// Props for the payment history component
export interface PaymentHistoryProps {
  agreementId?: string;
  onAddPayment?: () => void;
  payments?: Payment[];
  isLoading?: boolean;
  rentAmount?: number | null;
  onPaymentDeleted?: () => void;
  leaseStartDate?: Date | string;
  leaseEndDate?: Date | string;
}
