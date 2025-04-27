
import { Database } from '@/types/database.types';

type DbTables = Database['public']['Tables'];
type TableNames = keyof DbTables; 

export function asTableId<T extends TableNames>(
  table: T,
  id: string | null | undefined
): DbTables[T]['Row']['id'] {
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

export function asOverduePaymentId(id: string): DbTables['overdue_payments']['Row']['id'] {
  return asTableId('overdue_payments', id);
}

export function asTrafficFineId(id: string): DbTables['traffic_fines']['Row']['id'] {
  return asTableId('traffic_fines', id);
}

export function asImportId(id: string): DbTables['agreement_imports']['Row']['id'] {
  return asTableId('agreement_imports', id);
}

// Column casting functions
export function asLeaseIdColumn(id: string): DbTables['leases']['Row']['id'] {
  return asTableId('leases', id);
}

export function asAgreementIdColumn(id: string): DbTables['leases']['Row']['id'] {
  return asTableId('leases', id);
}

export function asImportIdColumn(id: string): DbTables['agreement_imports']['Row']['id'] {
  return asTableId('agreement_imports', id);
}

export function asTrafficFineIdColumn(id: string): DbTables['traffic_fines']['Row']['id'] {
  return asTableId('traffic_fines', id);
}

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

// Maintenance ID casting
export function asMaintenanceId(id: string): DbTables['maintenance']['Row']['id'] {
  return asTableId('maintenance', id);
}
