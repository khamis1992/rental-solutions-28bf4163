
import { Database } from '@/types/database.types';
import { 
  Tables,
  UUID,
  LeaseId,
  PaymentId,
  AgreementId 
} from '@/types/database-types';
import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';

// Typed helper for cast lease ID
export function castLeaseId(id: string): LeaseId {
  return id as LeaseId;
}

// Typed helper for cast agreement ID
export function castAgreementId(id: string): AgreementId {
  return id as AgreementId;
}

// Generic helper for database IDs 
export function castDatabaseId<T extends keyof Tables>(id: string): Tables[T]['Row']['id'] {
  return id as Tables[T]['Row']['id'];
}

// Type-safe helper for payment operations
export function castPaymentUpdate(update: Partial<Tables['unified_payments']['Update']>): Tables['unified_payments']['Update'] {
  return update as Tables['unified_payments']['Update'];
}

// Type-safe helper for overdue payments ID
export function castOverduePaymentAgreementId(id: string): Tables['overdue_payments']['Row']['agreement_id'] {
  return id as Tables['overdue_payments']['Row']['agreement_id'];
}

// Type-safe helper for unified payments lease ID
export function castUnifiedPaymentLeaseId(id: string): Tables['unified_payments']['Row']['lease_id'] {
  return id as Tables['unified_payments']['Row']['lease_id'];
}

// Type-safe helper for traffic fines agreement ID
export function castTrafficFineAgreementId(id: string): Tables['traffic_fines']['Row']['agreement_id'] {
  return id as Tables['traffic_fines']['Row']['agreement_id'];
}

// Type-safe helper for lease status
export function castLeaseStatus(status: string): Tables['leases']['Row']['status'] {
  return status as Tables['leases']['Row']['status'];
}

// Type-safe helper for lease update
export function castLeaseUpdate(update: Partial<Tables['leases']['Update']>): Tables['leases']['Update'] {
  return update as Tables['leases']['Update'];
}

// Type-safe helper for import ID
export function castImportId(id: string): string {
  return id as string;
}

// Utility function to check if response has data
export function hasData<T>(response: PostgrestSingleResponse<T> | PostgrestResponse<T>): response is { data: T; error: null } {
  return response.data !== null && response.error === null;
}

// Helper functions for RPC function returns
export interface DeleteAgreementsByImportIdResult {
  success: boolean;
  deleted_count: number;
  message?: string;
}

export interface RevertAgreementImportResult {
  success: boolean;
  deleted_count: number;
  message?: string;
}

export interface GenerateAgreementDocumentResult {
  success: boolean;
  document_url?: string;
  message?: string;
}

// Type-safe casting functions for RPC results
export function castDeleteAgreementsResult(result: unknown): DeleteAgreementsByImportIdResult {
  return result as DeleteAgreementsByImportIdResult;
}

export function castRevertAgreementImportResult(result: unknown): RevertAgreementImportResult {
  return result as RevertAgreementImportResult;
}

export function castGenerateAgreementDocumentResult(result: unknown): GenerateAgreementDocumentResult {
  return result as GenerateAgreementDocumentResult;
}
