
// Common type definitions for the application
export interface PaymentRecord {
  id: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  due_date: string;
}

export interface SimpleAgreement {
  id: string;
  agreement_number?: string;
  customer_id: string;
  vehicle_id: string;
  start_date: string;
  end_date: string;
  status: string;
  total_amount?: number;
  rent_amount?: number;
  payment_frequency: string;
  confirmation_email_sent?: boolean;
  down_payment?: number;
  created_at: string;
  updated_at: string;
  // Additional properties for compatibility with Agreement interface
  customer?: any;
  vehicle?: any;
  profiles?: any;
  vehicles?: any;
}

export interface FileUploadState {
  file: File | null;
  uploading: boolean;
  error: string | null;
}
