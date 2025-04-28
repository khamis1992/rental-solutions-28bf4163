import { Database } from '@/types/database.types';
import { asTableId, asTableStatus } from '@/lib/database/utils';

type Tables = Database['public']['Tables'];
type TableNames = keyof Tables;
type RowType<T extends TableNames> = Tables[T]['Row'];

// Re-export functions from our new consolidated utilities
export { asTableId, asTableStatus };
export { asLeaseId, asPaymentId, asAgreementId, asVehicleId, asMaintenanceId, asTrafficFineId, asImportId } from '@/lib/database';
export { asLeaseStatus, asPaymentStatus, asMaintenanceStatus } from '@/lib/database';

// For backward compatibility
export function asImportId(id: string) {
  return asTableId('agreement_imports', id);
}

// Keeping the function signature the same for backward compatibility
export function asAgreementId(id: string) {
  return asTableId('leases', id);
}
