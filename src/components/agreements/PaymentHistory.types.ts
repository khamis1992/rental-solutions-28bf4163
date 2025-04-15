
export interface Payment {
  id: string;
  amount: number;
  amount_paid: number;
  payment_date: string | null;
  payment_method: string | null;
  status: string;
  due_date?: string | null;
  description?: string | null;
}

export interface PaymentHistoryProps {
  agreementId: string;
  onAddPayment?: () => void;
}
