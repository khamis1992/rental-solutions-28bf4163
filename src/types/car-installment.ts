
// Types for car installment contracts and payments
export type PaymentStatusType = 'pending' | 'paid' | 'overdue' | 'cancelled' | 'scheduled';

export interface PaymentFilters {
  status?: string;
  dateRange?: {
    from?: string;
    to?: string;
  } | null;
  dateFrom?: string;
  dateTo?: string;
}

export interface ContractFilters {
  search?: string;
  status?: string;
}

export interface CarInstallmentContract {
  id: string;
  car_type: string;
  model_year: number;
  number_of_cars: number;
  price_per_car: number;
  total_contract_value: number;
  amount_paid: number;
  amount_pending: number;
  total_installments: number;
  remaining_installments: number;
  installment_value: number;
  category: string;
  overdue_payments: number;
  created_at: string;
  updated_at: string;
}

export interface CarInstallmentPayment {
  id: string;
  contract_id: string;
  cheque_number: string;
  drawee_bank: string;
  amount: number;
  payment_date: string;
  status: PaymentStatusType;
  paid_amount: number;
  remaining_amount: number;
  days_overdue?: number;
  payment_notes?: string;
  notes?: string;
  payment_reference?: string;
  reconciliation_status?: string;
  last_payment_check?: string;
  last_payment_date?: string;
  reconciliation_date?: string;
  last_status_change?: string;
  created_at: string;
  updated_at: string;
}

export interface ContractSummary {
  totalContracts: number;
  totalPortfolioValue: number;
  totalCollections: number;
  upcomingPayments: number;
}
