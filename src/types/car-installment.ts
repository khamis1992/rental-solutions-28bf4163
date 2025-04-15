
// Define types for car installment functionality

// Status types for installments
export type InstallmentStatus = "pending" | "paid" | "overdue" | "cancelled";

// Payment filters for filtering installment payments
export interface PaymentFilters {
  status?: InstallmentStatus | "all";
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// Car installment contract type
export interface CarInstallmentContract {
  id: string;
  car_type: string;
  category: string;
  model_year: number;
  number_of_cars: number;
  price_per_car: number;
  total_contract_value: number;
  amount_paid: number;
  amount_pending: number;
  total_installments: number;
  remaining_installments: number;
  installment_value: number;
  overdue_payments: number;
  created_at: string;
  updated_at: string;
}

// Car installment payment type
export interface CarInstallmentPayment {
  id: string;
  contract_id: string;
  amount: number;
  paid_amount: number;
  remaining_amount: number;
  payment_date: string;
  cheque_number: string;
  drawee_bank: string;
  status: InstallmentStatus;
  days_overdue: number;
  last_payment_date?: string;
  reconciliation_date?: string;
  payment_reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Summary type for contract overview
export interface ContractSummary {
  totalContracts: number;
  totalPortfolioValue: number;
  totalCollections: number;
  upcomingPayments: number;
}
