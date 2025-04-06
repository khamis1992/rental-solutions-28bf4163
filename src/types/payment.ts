
// Define payment types for our application

export interface BasePayment {
  id: string;
  payment_number: string;
  payment_date: Date;
  due_date: Date;
  amount: number;
  status: string;
  payment_method?: string;
  reference?: string;
  notes?: string;
}

export interface ContractPayment extends BasePayment {
  contract_id: string;
}

export interface CarInstallmentPayment extends BasePayment {
  contract_id: string;
}

// Generic Payment type that can be used across components
export interface Payment {
  id: string;
  amount: number;
  payment_date: string | Date | null;
  due_date?: string | Date;
  payment_method?: string;
  reference?: string;
  reference_number?: string | null;
  notes?: string;
  status: string;
  payment_number?: string;
  contract_id?: string;
}
