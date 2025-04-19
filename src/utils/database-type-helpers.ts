// Define the UUID type directly here to avoid circular imports
export type UUID = string;

// Type assertion helper functions that are safe for Supabase queries
export function asLeaseId(id: UUID | string): UUID {
  return id as UUID;
}

export function asPaymentId(id: UUID | string): UUID {
  return id as UUID;
}

export function asAgreementId(id: UUID | string): UUID {
  return id as UUID;
}

export function asImportId(id: UUID | string): UUID {
  return id as UUID;
}

export function asTrafficFineId(id: UUID | string): UUID {
  return id as UUID;
}

export function asVehicleId(id: UUID | string): UUID {
  return id as UUID;
}

export function asCustomerId(id: UUID | string): UUID {
  return id as UUID;
}

export function asProfileId(id: UUID | string): UUID {
  return id as UUID;
}

export function asLegalCaseId(id: UUID | string): UUID {
  return id as UUID;
}

// Column helper functions
export function asTrafficFineIdColumn(id: UUID | string): UUID {
  return id as UUID;
}

export function asLeaseIdColumn(id: UUID | string): UUID {
  return id as UUID;
}

export function asAgreementIdColumn(id: UUID | string): UUID {
  return id as UUID;
}

export function asImportIdColumn(id: UUID | string): UUID {
  return id as UUID;
}

export function asCustomerIdColumn(id: UUID | string): UUID {
  return id as UUID;
}

// Additional helper functions needed
export function asTableId(table: string, id: string): string {
  return id;
}

export function asStatusColumn(table: string, column: string, status: string): string {
  return status;
}

export function asPaymentStatusColumn(status: string): string {
  return status;
}

export function safelyExtractData<T>(response: { data: T | null; error: any } | null | undefined): T | null {
  if (!response || response.error || !response.data) {
    return null;
  }
  return response.data;
}

export function hasData<T>(
  response: { data: T | null; error: any } | null | undefined
): response is { data: T; error: null } {
  return !!response && !response.error && response.data !== null;
}
