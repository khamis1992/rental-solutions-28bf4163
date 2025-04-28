
export interface ExtendedPayment {
  id: string;
  lease_id: string;
  amount: number;
  amount_paid: number;
  balance: number;
  payment_date: string | null;
  payment_method: string | null;
  reference_number: string;
  notes: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  original_due_date: string | null;
  due_date: string | null;
  is_recurring: boolean;
  type: string;
  days_overdue: number;
  late_fine_amount: number;
  processing_fee: number;
  processed_by: string;
}
