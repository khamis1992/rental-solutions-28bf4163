
import { UUID } from '@/types/database-types';

// Helper functions for converting strings to typed IDs
export function asLeaseId(id: string): UUID {
  return id as UUID;
}

export function asLeaseIdColumn(id: string): UUID {
  return id as UUID;
}

export function asPaymentId(id: string): UUID {
  return id as UUID;
}

export function asVehicleId(id: string): UUID {
  return id as UUID;
}

export function asCustomerId(id: string): UUID {
  return id as UUID;
}

export function asAgreementId(id: string): UUID {
  return id as UUID;
}

export function asImportId(id: string): UUID {
  return id as UUID;
}
