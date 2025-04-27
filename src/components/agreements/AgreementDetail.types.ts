import { Agreement } from '@/lib/validation-schemas/agreement';
import { ExtendedPayment } from './PaymentHistory.types';

export interface AgreementDetailProps {
  agreement: Agreement | null;
  onDelete: (id: string) => void;
  onGenerateDocument?: () => void;
  onDataRefresh: () => void;
  rentAmount: number | null;
  contractAmount: number | null;
  onPaymentDeleted: () => void;
}

export interface AgreementDetailParams {
  [key: string]: string;
  id: string;
}

export interface PaymentSubmitParams {
  amount: number;
  paymentDate: Date;
  notes?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  includeLatePaymentFee?: boolean;
  isPartialPayment?: boolean;
  targetPaymentId?: string;
}

export interface DatabaseResponse<T> {
  data: T | null;
  error: Error | null;
}
