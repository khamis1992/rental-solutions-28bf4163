
import { UUID } from '@/types/database-types';
import { hasData } from '@/utils/supabase-type-helpers';

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

// Re-export hasData from supabase-type-helpers to fix import issues
export { hasData };

// Function to safely convert string to table ID
export function asTableId(id: string): UUID {
  return id as UUID;
}

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

