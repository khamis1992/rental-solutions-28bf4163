
import { Database } from "@/lib/database-types";
import { GenericSchema } from "@supabase/supabase-js";

export type AgreementStatus = "active" | "pending" | "completed" | "cancelled" | 
  "pending_payment" | "pending_deposit" | "draft" | "terminated" | "archived" | "closed";

export type DatabaseStatusColumn<T extends keyof Database['public']['Tables']> = 
  keyof Database['public']['Tables'][T]['Row'] extends 'status' 
    ? Database['public']['Tables'][T]['Row']['status'] 
    : never;

export type Payment = {
  id: string;
  amount: number;
  payment_date: Date;
  notes?: string;
  payment_method?: string;
  reference_number?: string;
  include_late_fee?: boolean;
  is_partial?: boolean;
  status: 'pending' | 'completed' | 'failed';
};

export type PaymentEntryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPayment?: Payment;
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
  id: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  file_name: string;
  total_records: number;
  processed_records: number;
  failed_records: number;
};

// Helper functions for type casting
export const asStatusColumn = <T extends keyof Database['public']['Tables']>(
  status: string
): DatabaseStatusColumn<T> => status as DatabaseStatusColumn<T>;

export const asAgreementIdColumn = (id: string) => id as string;
export const asImportIdColumn = (id: string) => id as string;
