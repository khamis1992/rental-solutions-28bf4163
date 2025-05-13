
export interface SpecialPaymentOptions {
  notes?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  includeLatePaymentFee?: boolean;
  isPartialPayment?: boolean;
  paymentType?: string;
}

export interface PaymentRecord {
  id: string;
  lease_id: string;
  amount: number;
  amount_paid?: number;
  balance?: number;
  payment_date: string;
  payment_method?: string;
  reference_number?: string;
  description?: string;
  status: string;
  type?: string;
  days_overdue?: number;
  late_fine_amount?: number;
  original_due_date?: string;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  data?: any;
  payment?: any;
}

// Type guards
export function isPaymentRecord(obj: any): obj is PaymentRecord {
  return obj
    && typeof obj === 'object'
    && 'id' in obj
    && 'lease_id' in obj
    && 'amount' in obj
    && 'payment_date' in obj
    && 'status' in obj;
}

export function isErrorResponse(obj: any): boolean {
  return obj
    && typeof obj === 'object'
    && 'error' in obj
    && obj.error !== null;
}
