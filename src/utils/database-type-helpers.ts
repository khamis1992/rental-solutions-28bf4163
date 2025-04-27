
import { Database } from '@/types/database.types';

type DbTables = Database['public']['Tables'];
type TableNames = keyof DbTables;
type RowType<T extends TableNames> = DbTables[T]['Row'];

// Generic table ID casting with proper typing
export function asTableId<T extends TableNames>(
  table: T,
  id: string | null | undefined
): DbTables[T]['Row']['id'] {
  return id as DbTables[T]['Row']['id'];
}

// Generic column value casting with proper typing
export function asColumnValue<
  T extends TableNames,
  K extends keyof DbTables[T]['Row']
>(
  table: T,
  column: K,
  value: string | null | undefined
): DbTables[T]['Row'][K] {
  return value as DbTables[T]['Row'][K];
}

// Status casting with proper typing
export function asStatus<T extends TableNames>(
  table: T,
  status: string | null | undefined
): DbTables[T]['Row']['status'] {
  return asColumnValue(table, 'status', status);
}

// Specific ID casting functions
export function asLeaseId(id: string): DbTables['leases']['Row']['id'] {
  return asTableId('leases', id);
}

export function asPaymentId(id: string): DbTables['unified_payments']['Row']['id'] {
  return asTableId('unified_payments', id);
}

export function asTrafficFineId(id: string): DbTables['traffic_fines']['Row']['id'] {
  return asTableId('traffic_fines', id);
}

export function asAgreementId(id: string): DbTables['leases']['Row']['id'] {
  return asTableId('leases', id);
}

// Add type-safe column exports
export const asAgreementIdColumn = (id: string) => asTableId('leases', id);
export const asLeaseIdColumn = (id: string) => asTableId('leases', id);
export const asImportIdColumn = (id: string) => asTableId('agreement_imports', id);
export const asTrafficFineIdColumn = (id: string) => asTableId('traffic_fines', id);

// Status casting functions with proper typing
export function asLeaseStatus(status: string): DbTables['leases']['Row']['status'] {
  return asStatus('leases', status);
}

export function asPaymentStatus(status: string): DbTables['unified_payments']['Row']['status'] {
  return asStatus('unified_payments', status);
}
