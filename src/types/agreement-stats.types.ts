
/**
 * Type definitions for agreement statistics
 */

export interface AgreementStats {
  totalAgreements: number;
  activeAgreements: number;
  pendingPayments: number;
  overduePayments: number;
  activeValue: number;
}

export interface AgreementStatusCount {
  status: string;
  count?: number;
}

export interface AgreementFinancialMetrics {
  totalValue: number;
  activeValue: number;
  completedValue: number;
  averageAgreementValue: number;
}

// Define allowed status values to improve type safety
export const AGREEMENT_STATUSES = {
  ACTIVE: 'active',
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  PENDING_PAYMENT: 'pending_payment',
  PENDING_DEPOSIT: 'pending_deposit',
  DRAFT: 'draft',
  TERMINATED: 'terminated',
  ARCHIVED: 'archived'
} as const;

export type AgreementStatus = typeof AGREEMENT_STATUSES[keyof typeof AGREEMENT_STATUSES];

export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  PARTIALLY_PAID: 'partially_paid',
} as const;

export type PaymentStatus = typeof PAYMENT_STATUSES[keyof typeof PAYMENT_STATUSES];
