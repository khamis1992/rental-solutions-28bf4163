
export enum AgreementStatus {
  PENDING_PAYMENT = 'pending_payment',
  PENDING_DEPOSIT = 'pending_deposit',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  CLOSED = 'closed',
  TERMINATED = 'terminated',
  ARCHIVED = 'archived',
  PENDING = 'pending',
  EXPIRED = 'expired',
  DRAFT = 'draft'
}

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  driver_license?: string;
  address?: string;
  full_name?: string;
  phone_number?: string;
  nationality?: string;
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
  image_url?: string;
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
  created_at?: string | Date;
  agreement_number?: string;
  notes?: string;
  total_amount?: number;
  deposit_amount?: number;
  signature_url?: string;
  rent_amount?: number;
  daily_late_fee?: number;
  agreement_type?: string;
  updated_at?: string | Date;
  last_ai_update?: string | Date;
}

export interface EnhancedAnalysisResult {
  id?: string;
  agreement_id?: string;
  agreement?: Agreement;
  riskLevel?: 'low' | 'medium' | 'high';
  risk_level?: 'low' | 'medium' | 'high';
  confidenceScore?: number;
  confidence?: number;
  recommendations?: string[];
  recommended_status?: AgreementStatus;
  explanation?: string;
  action_items?: string[];
  actionItems?: string[];
  analyzed_at?: string;
  currentStatus?: AgreementStatus;
  current_status?: AgreementStatus;
  historical_data?: any;
  payment_factors?: {
    paymentHistory?: string;
    latePayments?: number;
    missedPayments?: number;
    paymentTrend?: 'improving' | 'stable' | 'declining';
  };
  vehicle_factors?: {
    condition?: string;
    maintenanceHistory?: string;
    estimatedValue?: number;
    depreciation?: number;
  };
  customer_factors?: {
    customerHistory?: string;
    previousAgreements?: number;
    paymentReliability?: number;
  };
  risk_factors?: any;
  trend_analysis?: any;
  prediction_accuracy?: number;
  model_version?: string;
  intervention_suggestions?: string[];
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
