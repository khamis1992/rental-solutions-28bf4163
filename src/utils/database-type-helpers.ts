
// Define the UUID type for use throughout the application
export type UUID = string;

// Helper function for consistent type casting of UUIDs
export function castToUUID(id: string | undefined | null): UUID | null {
  if (!id) return null;
  return id as UUID;
}

// Helper function to ensure we have a valid UUID for queries
export function ensureUUID(id: string | UUID | undefined | null): UUID {
  if (!id) throw new Error('Invalid ID: null or undefined');
  return id as UUID;
}

// Original helper functions with improved implementation
export function asLeaseId(id: string): UUID {
  return id as UUID;
}

export function asLeaseIdColumn(id: string): string {
  return id;
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

// Helper functions for column-specific IDs
export function asAgreementIdColumn(id: string): string {
  return id;
}

export function asImportIdColumn(id: string): string {
  return id;
}

export function asTrafficFineIdColumn(id: string): string {
  return id;
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
