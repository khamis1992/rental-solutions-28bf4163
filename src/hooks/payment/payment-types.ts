
import { Payment } from '@/types/payment-types.unified';

// Define the type for payment hooks
export interface PaymentHook {
  payments: Payment[];
  isLoading: boolean;
  error: any;
  refetch: () => void;
  addPayment: (newPayment: Partial<Payment>) => Promise<any>;
  updatePayment: (id: string, updateData: Partial<Payment>) => Promise<any>;
  deletePayment: (id: string) => Promise<any>;
  processPayment: (amount: number, paymentDate: Date, options?: PaymentOptions) => Promise<any>;
  fetchPayments: () => void;
  isConnected: boolean;
}

// Define payment options
export interface PaymentOptions {
  notes?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  includeLatePaymentFee?: boolean;
  isPartialPayment?: boolean;
  paymentType?: string;
  targetPaymentId?: string;
}

// Define the type for payment query result
export interface PaymentQueryResult {
  data: Payment[];
  error: any;
  isLoading: boolean;
  refetch: () => void;
}

// Define the return type for the payment adapter
export interface PaymentAdapter extends PaymentHook {
  paymentQuery: any; // The new query interface
}
