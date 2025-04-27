
export interface Payment {
  id: string;
  lease_id: string;
  amount: number;
  payment_date: string | null;
  status: string;
  payment_method?: string;
  transaction_id?: string;
}

export interface PaymentHistoryProps {
  agreementId: string;
}
