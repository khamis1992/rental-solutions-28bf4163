
export interface CarInstallmentContract {
  id: string;
  created_at: string;
  updated_at: string;
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
}

export interface CarInstallmentPayment {
  id: string;
  contract_id: string;
  payment_date: string;
  amount: number;
  status: string;
  cheque_number: string;
  drawee_bank: string;
  payment_notes?: string;
  days_overdue: number;
  reconciliation_status?: string;
}

export interface ContractFilters {
  category?: string;
  car_type?: string;
  model_year?: number;
  status?: string;
  search?: string;
}
