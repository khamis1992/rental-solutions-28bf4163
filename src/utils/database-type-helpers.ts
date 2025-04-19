
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

// Add functions needed by AgreementList.tsx
export function asAgreementIdColumn(id: string): UUID {
  return id as UUID;
}

export function asImportIdColumn(id: string): UUID {
  return id as UUID;
}

export function asTrafficFineIdColumn(id: string): UUID {
  return id as UUID;
}

// Function to check if Supabase response has data
export function hasData<T>(
  response: { data: T | null; error: any } | null | undefined
): response is { data: T; error: null } {
  return !!response && !response.error && response.data !== null;
}

// Function to safely convert string to table ID
export function asTableId(id: string): UUID {
  return id as UUID;
}

// Export UUID type to avoid circular dependencies
export { UUID };

// Functions for column assertions in queries
export function asStatusColumn(status: string): string {
  return status;
}

export function asPaymentStatusColumn(status: string): string {
  return status;
}

// Safe data extraction helper
export function safelyExtractData<T>(response: any): T | null {
  if (!response || response.error || !response.data) {
    return null;
  }
  return response.data as T;
}
