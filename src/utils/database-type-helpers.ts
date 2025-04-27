import { Database } from '@/types/database.types';

type DbTables = Database['public']['Tables'];
type TableNames = keyof DbTables; 
type RowType<T extends TableNames> = DbTables[T]['Row'];

export function asTableId<T extends TableNames>(table: T, id: string | null | undefined): DbTables[T]['Row']['id'] {
  return id as DbTables[T]['Row']['id'];
}

export function asColumnValue<T extends TableNames, K extends keyof DbTables[T]['Row']>(
  table: T,
  column: K,
  value: string
): DbTables[T]['Row'][K] {
  return value as DbTables[T]['Row'][K];
}

// Status casting function
export function asStatus<T extends TableNames>(
  table: T,
  status: string
): DbTables[T]['Row']['status'] {
  return asColumnValue(table, 'status', status);
}

// ID casting functions
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

// Add columns exports required by AgreementList.tsx
export const asAgreementIdColumn = (id: string) => asTableId('leases', id);
export const asLeaseIdColumn = (id: string) => asTableId('leases', id);
export const asImportIdColumn = (id: string) => asTableId('agreement_imports', id);
export const asTrafficFineIdColumn = (id: string) => asTableId('traffic_fines', id);

// Status casting functions 
export function asLeaseStatus(status: string): DbTables['leases']['Row']['status'] {
  return asStatus('leases', status);
}

export function asPaymentStatus(status: string): DbTables['unified_payments']['Row']['status'] {
  return asStatus('unified_payments', status);
}

// Vehicle ID casting
export function asVehicleId(id: string): DbTables['vehicles']['Row']['id'] {
  return asTableId('vehicles', id);
}

// Add missing import ID function
export function asImportId(id: string): string {
  return id; // Simple string casting since imports might have different ID structures
}
