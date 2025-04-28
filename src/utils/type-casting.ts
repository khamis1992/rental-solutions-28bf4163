import { Database } from "@/types/database.types";

// Generic function to cast IDs to their table-specific types
export function asTableId<T extends keyof Database['public']['Tables']>(
  tableName: T, 
  id: string
): Database['public']['Tables'][T]['Row']['id'] {
  return id as Database['public']['Tables'][T]['Row']['id'];
}

// Type alias for import ID
export type ImportId = Database['public']['Tables']['agreement_imports']['Row']['id'];

// Type alias for agreement ID
export type AgreementId = Database['public']['Tables']['leases']['Row']['id'];

// Helper functions that use the generic asTableId function
export function castToImportId(id: string) {
  return asTableId('agreement_imports', id);
}

export function castToAgreementId(id: string) {
  return asTableId('leases', id);
}

// Other table-specific ID casting functions
export function asCustomerId(id: string) {
  return asTableId('profiles', id);
}

export function asVehicleId(id: string) {
  return asTableId('vehicles', id);
}

export function asPaymentId(id: string) {
  return asTableId('unified_payments', id);
}

export function asMaintenanceId(id: string) {
  return asTableId('maintenance', id);
}

export function asDocumentId(id: string) {
  return asTableId('agreement_documents', id);
}

// Type-safe status casting functions
export function asStatus<T extends keyof Database['public']['Tables']>(
  tableName: T,
  status: string
): Database['public']['Tables'][T]['Row']['status'] {
  return status as Database['public']['Tables'][T]['Row']['status'];
}

export function asPaymentStatus(status: string) {
  return asStatus('unified_payments', status);
}

export function asAgreementStatus(status: string) {
  return asStatus('leases', status);
}
