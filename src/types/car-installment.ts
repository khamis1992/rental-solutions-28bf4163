
// Define the CarInstallmentContract interface
export interface CarInstallmentContract {
  id: string;
  car_type?: string;
  category?: string;
  model_year?: number;
  number_of_cars?: number;
  price_per_car?: number;
  total_contract_value?: number;
  amount_paid?: number;
  amount_pending?: number;
  total_installments?: number;
  remaining_installments?: number;
  installment_value?: number;
  created_at?: string;
  updated_at?: string;
  overdue_payments?: number;
}

// Define the ContractSummary interface
export interface ContractSummary {
  totalContracts: number;
  totalAmount: number;
  totalPaid: number;
  totalPending: number;
  overdueAmount: number;
  overdueCount: number;
  completionRate: number;
}

// Define the PaymentFilters interface
export interface PaymentFilters {
  status?: InstallmentStatus;
  dateRange?: [Date, Date] | null;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

// Define the InstallmentStatus type
export type InstallmentStatus = 'all' | 'pending' | 'paid' | 'overdue';

// Define the CarInstallmentPayment interface
export interface CarInstallmentPayment {
  id: string;
  contract_id?: string;
  payment_date?: Date | string;
  amount?: number;
  paid_amount?: number;
  remaining_amount?: number;
  status?: string;
  cheque_number?: string;
  drawee_bank?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  last_payment_date?: string;
  days_overdue?: number;
}

// Define the ContractFilters interface for filtering contracts
export interface ContractFilters {
  search?: string;
  status?: string;
  category?: string;
  dateRange?: [Date, Date] | null;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}
