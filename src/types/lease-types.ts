
import { Database } from './database.types';

// Lease related types
export type LeaseRow = Database['public']['Tables']['leases']['Row'];
export type LeaseInsert = Database['public']['Tables']['leases']['Insert'];
export type LeaseUpdate = Database['public']['Tables']['leases']['Update'];
export type LeaseStatus = LeaseRow['status'];

// Strongly typed lease statuses
export const LEASE_STATUSES = {
  ACTIVE: 'active',
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  PENDING_PAYMENT: 'pending_payment',
  PENDING_DEPOSIT: 'pending_deposit',
  DRAFT: 'draft',
  TERMINATED: 'terminated',
  ARCHIVED: 'archived',
  CLOSED: 'closed'
} as const;

