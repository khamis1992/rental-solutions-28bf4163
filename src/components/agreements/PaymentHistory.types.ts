
import { PaymentStatus } from '@/types/database-common';

export interface PaymentHistoryItem {
  id: string;
  agreement_id: string;
  amount: number;
  status: PaymentStatus;
  payment_date: string;
  method?: string;
  reference?: string;
}

export interface PaymentHistoryProps {
  agreementId: string;
  readonly?: boolean;
}

export interface PaymentFilterParams {
  status?: string[];
  dateRange?: {
    from: Date | undefined;
    to: Date | undefined;
  };
  paymentMethods?: string[];
  amountRange?: {
    min: number | undefined;
    max: number | undefined;
  };
}
