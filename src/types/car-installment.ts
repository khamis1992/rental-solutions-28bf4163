
/**
 * Type definitions for car installment contracts and payments
 */

// Define the car installment contract type
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

// Define the car installment payment status type
export type PaymentStatusType = 'pending' | 'paid' | 'overdue' | 'cancelled' | 'scheduled';
export type InstallmentStatus = PaymentStatusType; // Alias for backward compatibility

// Define the car installment payment type
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
  days_overdue: number;
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

// Define the contract summary type
export interface ContractSummary {
  totalContracts: number;
  totalPortfolioValue: number;
  totalCollections: number;
  upcomingPayments: number;
}

// Define the imported payment type
export interface ImportedPayment {
  cheque_number: string;
  drawee_bank: string;
  amount: number;
  payment_date: string;
  contract_id?: string;
  notes?: string;
}

// Define the contract filters type
export interface ContractFilters {
  search: string;
  status?: string;
}

// Define the payment filters type
export interface PaymentFilters {
  status?: PaymentStatusType | 'all';
  dateFrom?: string;
  dateTo?: string;
}

// Mock data helper for car installment services
export const createEmptyCarInstallmentContract = (): CarInstallmentContract => ({
  id: '',
  car_type: '',
  model_year: 0,
  number_of_cars: 0,
  price_per_car: 0,
  total_contract_value: 0,
  amount_paid: 0,
  amount_pending: 0,
  total_installments: 0,
  remaining_installments: 0,
  installment_value: 0,
  category: '',
  overdue_payments: 0,
  created_at: '',
  updated_at: ''
});

export const createEmptyCarInstallmentPayment = (): CarInstallmentPayment => ({
  id: '',
  contract_id: '',
  cheque_number: '',
  drawee_bank: '',
  amount: 0,
  payment_date: '',
  status: 'pending',
  paid_amount: 0,
  remaining_amount: 0,
  days_overdue: 0,
  created_at: '',
  updated_at: ''
});
