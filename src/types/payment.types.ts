
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

export interface Payment extends PaymentRow {
  // Add any additional fields needed that aren't in the database types
}

export interface SpecialPaymentOptions {
  notes?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  includeLatePaymentFee?: boolean;
  isPartialPayment?: boolean;
  paymentType?: string;
  targetPaymentId?: string;
}
