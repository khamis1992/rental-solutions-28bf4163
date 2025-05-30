export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
export type PaymentType = 'regular' | 'late_fee' | 'deposit' | 'refund';

export interface PaymentSchedule {
  id: string;
  agreement_id: string;
  payment_id: string;
  due_date: string;
  amount: number;
  status: PaymentStatus;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentScheduleFilterParams {
  agreementId?: string;
  status?: PaymentStatus;
  startDate?: string;
  endDate?: string;
} 