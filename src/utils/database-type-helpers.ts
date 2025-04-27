
import { Database } from '@/types/database.types';

type Tables = Database['public']['Tables'];
type TableNames = keyof Tables;
type RowType<T extends TableNames> = Tables[T]['Row'];

export function asTableId<T extends TableNames>(table: T, id: string): RowType<T>['id'] {
  return id as RowType<T>['id'];
}

export function asTableStatus<T extends TableNames>(table: T, status: string): RowType<T>['status'] {
  return status as RowType<T>['status'];
}

export function asLeaseId(id: string) {
  return asTableId('leases', id);
}

export function asPaymentId(id: string) {
  return asTableId('unified_payments', id);
}

export function asAgreementId(id: string) {
  return asTableId('leases', id);
}

export function asImportId(id: string) {
  return asTableId('agreement_imports', id);
}

export function asTrafficFineId(id: string) {
  return asTableId('traffic_fines', id);
}

export function asVehicleId(id: string) {
  return asTableId('vehicles', id);
}

export function asMaintenanceId(id: string) {
  return asTableId('maintenance', id);
}

// Column-specific type casting functions
export function asLeaseStatus(status: string) {
  return asTableStatus('leases', status);
}

export function asPaymentStatus(status: string) {
  return asTableStatus('unified_payments', status);
}

export function asMaintenanceStatus(status: string) {
  return asTableStatus('maintenance', status);
}

// Column alias for backward compatibility
export function asLeaseIdColumn(id: string) {
  return asLeaseId(id);
}

export function asStatusColumn(status: string) {
  return status;
}

export function asPaymentStatusColumn(status: string) {
  return asPaymentStatus(status);
}
