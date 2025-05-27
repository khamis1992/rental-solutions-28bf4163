
import { AgreementStatus } from './types';

// Agreement status values as constants for use in components
export const AGREEMENT_STATUS_VALUES = {
  DRAFT: 'draft' as const,
  ACTIVE: 'active' as const,
  PENDING: 'pending' as const,
  CLOSED: 'closed' as const,
  CANCELLED: 'cancelled' as const,
  EXPIRED: 'expired' as const,
};

export const AGREEMENT_STATUS_OPTIONS = [
  { value: AGREEMENT_STATUS_VALUES.DRAFT, label: 'Draft' },
  { value: AGREEMENT_STATUS_VALUES.ACTIVE, label: 'Active' },
  { value: AGREEMENT_STATUS_VALUES.PENDING, label: 'Pending' },
  { value: AGREEMENT_STATUS_VALUES.CLOSED, label: 'Closed' },
  { value: AGREEMENT_STATUS_VALUES.CANCELLED, label: 'Cancelled' },
  { value: AGREEMENT_STATUS_VALUES.EXPIRED, label: 'Expired' },
];
