
import { Database } from '@/types/database.types';

export type Payment = Database['public']['Tables']['unified_payments']['Row'];

export interface ExtendedPayment extends Payment {
  reference_number?: string;
  notes?: string;
}

export interface PaymentHistoryProps {
  payments?: Payment[];
  isLoading?: boolean;
  rentAmount?: number;
  onPaymentDeleted: () => void;
  onPaymentUpdated: (payment: Partial<Payment>) => Promise<void>;
  leaseStartDate?: string;
  leaseEndDate?: string;
}
