
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
