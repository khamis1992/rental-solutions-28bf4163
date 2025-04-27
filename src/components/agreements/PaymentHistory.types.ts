
export interface Payment {
  id: string;
  amount: number;
  status: string;
  description?: string | null;
  payment_date?: Date | string | null;
  due_date?: Date | string | null;
  lease_id?: string;
  payment_method?: string | null;
  balance?: number;
  amount_paid?: number;
  late_fine_amount?: number;
  days_overdue?: number;
}

export interface ExtendedPayment extends Payment {
  // Additional properties specific to the application
  isEditable?: boolean;
  formattedDueDate?: string;
  formattedPaymentDate?: string;
  statusBadge?: string;
  isPaid?: boolean;
  isLate?: boolean;
}
