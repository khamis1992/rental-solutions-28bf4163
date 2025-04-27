
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
  contractAmount?: number;
  onPaymentDeleted: () => void;
  onPaymentUpdated: (payment: Partial<ExtendedPayment>) => Promise<void>;
  onRecordPayment?: (payment: Partial<ExtendedPayment>) => void;
  leaseStartDate?: string;
  leaseEndDate?: string;
}
