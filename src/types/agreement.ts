
export enum AgreementStatus {
  PENDING_PAYMENT = 'pending_payment',
  PENDING_DEPOSIT = 'pending_deposit',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  CLOSED = 'closed',
  TERMINATED = 'terminated',
  ARCHIVED = 'archived',
}

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  driver_license?: string;
  address?: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin?: string;
  color?: string;
  status?: string;
}

export interface Agreement {
  id?: string;
  customer_id?: string;
  vehicle_id?: string;
  start_date?: Date;
  end_date?: Date;
  status?: AgreementStatus;
  terms_accepted?: boolean;
  additional_drivers?: string[];
  
  // Additional properties needed by components
  customers?: Customer;
  vehicles?: Vehicle;
  customerId?: string;
  vehicleId?: string;
  created_at?: string;
  agreement_number?: string;
  notes?: string;
  total_amount?: number;
  deposit_amount?: number;
  signature_url?: string;
  rent_amount?: number;
  daily_late_fee?: number;
  agreement_type?: string;
}

export interface EnhancedAnalysisResult {
  agreement?: Agreement;
  riskLevel?: 'low' | 'medium' | 'high';
  confidenceScore?: number;
  recommendations?: string[];
  paymentFactors?: {
    paymentHistory?: string;
    latePayments?: number;
    missedPayments?: number;
    paymentTrend?: 'improving' | 'stable' | 'declining';
  };
  vehicleFactors?: {
    condition?: string;
    maintenanceHistory?: string;
    estimatedValue?: number;
    depreciation?: number;
  };
  customerFactors?: {
    customerHistory?: string;
    previousAgreements?: number;
    paymentReliability?: number;
  };
}

// Type for the AgreementDetailPage component's state
export interface AgreementDetailState {
  agreement: Agreement | null;
  loading: boolean;
  error: string | null;
  enhancedAnalysis: EnhancedAnalysisResult | null;
  isAnalyzing: boolean;
}

// Types for various API responses
export interface AgreementResponse {
  agreement: Agreement;
  customer: Customer;
  vehicle: Vehicle;
}
