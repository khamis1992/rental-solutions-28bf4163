
import { Agreement } from '@/lib/validation-schemas/agreement';
import { AgreementId } from '@/types/database-types';
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

export interface AgreementDetailRouteProps {
  id?: string;
}

export interface PaymentSubmitParams {
  amount: number;
  paymentDate: Date;
  notes?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  includeLatePaymentFee?: boolean;
  isPartialPayment?: boolean;
}
