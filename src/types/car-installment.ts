
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

// Define the ContractSummary interface with all properties needed
export interface ContractSummary {
  totalContracts: number;
  totalAmount: number;
  totalPaid: number;
  totalPending: number;
  overdueAmount: number;
  overdueCount: number;
  completionRate: number;
  // Add these properties for backward compatibility
  totalPortfolioValue?: number;
  totalCollections?: number;
  upcomingPayments?: number;
}

// Define the PaymentFilters interface
export interface PaymentFilters {
  status?: InstallmentStatus;
  dateRange?: [Date, Date] | null;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  // Add these properties for backward compatibility
  dateFrom?: string;
  dateTo?: string;
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

// Define TrafficFine interface for consistency
export interface TrafficFine {
  id: string;
  violation_number: string;
  violation_date: string;
  fine_amount: number;
  violation_charge: string;
  fine_location?: string;
  license_plate: string;
  payment_status?: string;
  lease_id?: string;
  customer_id?: string;
  vehicle_id?: string;
  validation_status?: string;
  validation_date?: string;
  assignment_status?: string;
  // Camel case aliases for UI components
  violationNumber?: string;
  violationDate?: string | Date;
  fineAmount?: number;
  violationCharge?: string;
  location?: string;
  licensePlate?: string;
  paymentStatus?: string;
  leaseId?: string;
  customerId?: string;
  vehicleId?: string;
}

export interface TrafficFineCreatePayload {
  violation_number: string;
  violation_date: string;
  fine_amount: number;
  violation_charge: string;
  fine_location?: string;
  license_plate: string;
  payment_status?: string;
}
