
export type InstallmentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export interface CarInstallmentContract {
  id: string;
  car_type: string;
  model_year: number;
  number_of_cars: number;
  price_per_car: number;
  total_contract_value: number;
  total_installments: number;
  remaining_installments: number;
  amount_paid: number;
  amount_pending: number;
  overdue_payments: number;
  installment_value: number;
  created_at: string;
  updated_at: string;
}

export interface CarInstallmentPayment {
  id: string;
  contract_id: string;
  cheque_number: string;
  drawee_bank: string;
  amount: number;
  paid_amount: number;
  remaining_amount: number;
  payment_date: string;
  status: InstallmentStatus;
  days_overdue?: number;
  payment_notes?: string;
  payment_reference?: string;
  created_at: string;
  updated_at: string;
}

export interface ContractSummary {
  totalContracts: number;
  totalPortfolioValue: number;
  totalCollections: number;
  upcomingPayments: number;
}

export interface ImportedPayment {
  cheque_number: string;
  drawee_bank: string;
  amount: number;
  payment_date: string;
  contract_id?: string;
  notes?: string;
}

export interface ContractFilters {
  search: string;
  status?: string;
}

export interface PaymentFilters {
  status?: InstallmentStatus | 'all';
  dateFrom?: string;
  dateTo?: string;
}
