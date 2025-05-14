
import { DbId } from './database-common';

// Using a string type instead of an enum for better compatibility
export type PaymentStatus = string;

export interface Payment {
  id: string;
  lease_id: string;
  amount: number;
  payment_date?: string | null;
  due_date?: string | null;
  status: PaymentStatus;
  payment_method?: string;
  reference_number?: string | null;
  transaction_id?: string | null;
  notes?: string;
  type?: string;
  days_overdue?: number;
  late_fine_amount?: number;
  description?: string;
  amount_paid?: number;
  balance?: number;
  original_due_date?: string | null;
}

export interface PaymentHistoryProps {
  payments: Payment[];
  isLoading: boolean;
  rentAmount: number | null;
  contractAmount?: number | null;
  onPaymentDeleted: (paymentId: string) => void;
  onPaymentUpdated: (payment: Partial<Payment>) => Promise<boolean>;
  onRecordPayment: (payment: Partial<Payment>) => void;
  leaseStartDate: string | Date | null;
  leaseEndDate: string | Date | null;
  leaseId?: string;
}

export interface SpecialPaymentOptions {
  notes?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  includeLatePaymentFee?: boolean;
  isPartialPayment?: boolean;
  paymentType?: string;
  targetPaymentId?: string; // Add this missing property
}
