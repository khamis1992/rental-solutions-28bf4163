
import { Database } from "@/types/database.types";
import { DbId, LeaseStatus, PaymentStatus } from '@/types/database-common';
import { GenericSchema } from "@supabase/supabase-js";

export type AgreementStatus = LeaseStatus;

export type DatabaseStatusColumn<T extends keyof Database['public']['Tables']> = 
  keyof Database['public']['Tables'][T]['Row'] extends 'status' 
    ? Database['public']['Tables'][T]['Row']['status'] 
    : never;

export type Payment = {
  id: DbId;
  amount: number;
  payment_date: Date;
  notes?: string;
  payment_method?: string;
  reference_number?: string;
  transaction_id?: string; // Added for compatibility
  include_late_fee?: boolean;
  is_partial?: boolean;
  status: PaymentStatus;
};

export type PaymentEntryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string; // Added to fix compatibility errors
  description?: string; // Added to fix compatibility errors
  defaultAmount?: number; // Added to fix compatibility errors
  rentAmount?: number; // Added to fix compatibility errors
  lateFeeDetails?: { amount: number; daysLate: number } | null; // Added to fix compatibility errors
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
export const asStatusColumn = <T extends keyof Database['public']['Tables']>(
  status: string
): DatabaseStatusColumn<T> => status as DatabaseStatusColumn<T>;

export const asAgreementIdColumn = (id: string) => id as DbId;
export const asImportIdColumn = (id: string) => id as DbId;
