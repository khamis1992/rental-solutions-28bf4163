import { Database } from '@/types/database.types';
import { DbId, LeaseStatus, PaymentStatus } from '@/types/database-common';

export type AgreementStatus = LeaseStatus;

export type Payment = {
  id: DbId;
  amount: number;
  payment_date: Date;
  notes?: string;
  payment_method?: string;
  reference_number?: string;
  transaction_id?: string;
  include_late_fee?: boolean;
  is_partial?: boolean;
  status: PaymentStatus;
};

export type PaymentEntryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  defaultAmount?: number;
  rentAmount?: number;
  lateFeeDetails?: { amount: number; daysLate: number } | null;
  selectedPayment?: Payment | null;
  onSubmit: (
    amount: number,
    paymentDate: Date,
    notes?: string,
    paymentMethod?: string,
    referenceNumber?: string,
    includeLatePaymentFee?: boolean,
    isPartialPayment?: boolean
  ) => Promise<void>;
};

export type AgreementImport = {
  id: DbId;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  file_name: string;
  total_records: number;
  processed_records: number;
  failed_records: number;
};

// Helper functions for type casting with standardized naming
export const asAgreementIdColumn = (id: string) => id as DbId;
export const asImportIdColumn = (id: string) => id as DbId;
export const asStatusColumn = (status: string) => status as AgreementStatus;
