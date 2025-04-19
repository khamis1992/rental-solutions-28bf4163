
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

export function asTrafficFineIdColumn(id: UUID): UUID {
  return id;
}

export function asLeaseIdColumn(id: UUID): UUID {
  return id;
}

// Additional helper functions needed
export function asTableId(table: string, id: string): string {
  return id;
}

export function asAgreementIdColumn(id: UUID): UUID {
  return id;
}

export function asImportIdColumn(id: UUID): UUID {
  return id;
}

export function asStatusColumn(status: string): string {
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
