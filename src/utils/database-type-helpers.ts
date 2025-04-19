
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

export function hasData<T>(
  response: { data: T | null; error: any } | null | undefined
): response is { data: T; error: null } {
  return !!response && !response.error && response.data !== null;
}
