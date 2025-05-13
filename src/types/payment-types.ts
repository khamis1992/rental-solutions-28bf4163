
import { Database } from './database.types';

export type PaymentRow = Database['public']['Tables']['unified_payments']['Row'];
export type PaymentInsert = Database['public']['Tables']['unified_payments']['Insert'];
export type PaymentUpdate = Database['public']['Tables']['unified_payments']['Update'];
export type PaymentStatus = string;

export interface PaymentMetrics {
  sent: number;
  opened: number;
  clicked: number;
  delivered: number;
  conversion: number;
}

// Define the structure for payment record to use in services and components
export interface PaymentRecord {
  id: string;
  lease_id: string;
  amount: number;
  amount_paid: number;
  balance: number;
  status: string;
  payment_date: string;
  payment_method: string;
  reference_number: string;
  description?: string;
  type?: string;
  days_overdue?: number;
  late_fine_amount?: number;
  original_due_date?: string;
  created_at?: string;
  updated_at?: string;
}

// Type guard to check if an object is a PaymentRecord
export function isPaymentRecord(obj: any): obj is PaymentRecord {
  return obj && 
         typeof obj === 'object' && 
         'id' in obj && 
         'lease_id' in obj && 
         'amount' in obj;
}

// Type guard to check if there was an error in the response
export function isErrorResponse(obj: any): boolean {
  return obj && 
         typeof obj === 'object' && 
         ('error' in obj || 'message' in obj || 'code' in obj);
}
