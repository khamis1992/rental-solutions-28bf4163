
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
}

export interface PaymentListProps {
  leaseId: string;
  onPaymentUpdated?: () => void;
}
