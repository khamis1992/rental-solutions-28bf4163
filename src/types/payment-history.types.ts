import { Payment } from './payment.types';

export type PaymentHistoryItem = Payment;

export interface PaymentHistoryResponse {
  data: PaymentHistoryItem[];
  error: any | null;
}

export interface PaymentSchedule {
  id: string;
  lease_id: string;
  amount: number;
  due_date: string;
  status: string;
  actual_payment_date?: string;
  transaction_id?: string;
  late_fee_applied?: number;
  balance?: number;
}

export type Payment = PaymentHistoryItem;
