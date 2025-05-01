
// Status constants used for agreements
export const AGREEMENT_STATUSES = {
  ACTIVE: 'active',
  PENDING: 'pending',
  PENDING_PAYMENT: 'pending_payment',
  PENDING_DEPOSIT: 'pending_deposit',
  DRAFT: 'draft',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  TERMINATED: 'terminated',
  CLOSED: 'closed',
  ARCHIVED: 'archived',
  EXPIRED: 'expired'
};

// Status constants for payments
export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  PARTIALLY_PAID: 'partially_paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  PROCESSING: 'processing'
};

// Type for agreement statistics
export interface AgreementStats {
  totalAgreements: number;
  activeAgreements: number;
  pendingPayments: number;
  overduePayments: number;
  activeValue: number;
}
