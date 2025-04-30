export interface PaymentHistoryItem {
  id: string;
  agreement_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  date: string;
  method?: string;
  reference?: string;
}
