
// Define the UUID type directly here to avoid circular imports
export type UUID = string;

// Helper functions for converting strings to typed IDs
export function asLeaseId(id: UUID): UUID {
  return id;
}

export function asPaymentId(id: UUID): UUID {
  return id;
}

export function asAgreementId(id: UUID): UUID {
  return id; 
}

export function asImportId(id: UUID): UUID {
  return id;
}

export function asTrafficFineId(id: UUID): UUID {
  return id;
}

export function asVehicleId(id: UUID): UUID {
  return id;
}

export function asCustomerId(id: UUID): UUID {
  return id;
}

export function asProfileId(id: UUID): UUID {
  return id;
}

export function asLegalCaseId(id: UUID): UUID {
  return id;
}

// Column helper functions
export function asTrafficFineIdColumn(id: string | UUID): UUID {
  return id as UUID;
}

export function asLeaseIdColumn(id: string | UUID): UUID {
  return id as UUID;
}

export function asAgreementIdColumn(id: string | UUID): UUID {
  return id as UUID;
}

export function asImportIdColumn(id: string | UUID): UUID {
  return id as UUID;
}

export function asCustomerIdColumn(id: UUID): UUID {
  return id as UUID;
}

// Additional helper functions needed
export function asTableId(table: string, id: string | UUID): UUID {
  return id as UUID;
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
