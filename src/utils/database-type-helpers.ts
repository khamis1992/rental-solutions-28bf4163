
import { Database } from '@/types/database.types';
import { PostgrestSingleResponse } from '@supabase/supabase-js';

// Define useful types for database operations
type Tables = Database['public']['Tables'];
type SchemaName = keyof Database;

/**
 * Type guard to check if a response has data and no error
 */
export function hasData<T>(response: PostgrestSingleResponse<T>): response is PostgrestSingleResponse<T> & { data: T } {
  return response !== null && response.error === null && response.data !== null;
}

/**
 * Type guard to check if a response has valid data
 */
export function isValidResponse<T>(response: PostgrestSingleResponse<T>): response is PostgrestSingleResponse<T> & { data: T } {
  return Boolean(response && !response.error && response.data !== null && response.data !== undefined);
}

/**
 * Function to safely get data from a Supabase response
 */
export function safelyGetData<T>(response: PostgrestSingleResponse<T> | null): T | null {
  if (!response || response.error || !response.data) {
    return null;
  }
  return response.data;
}

// Type-safe ID helpers
export function asVehicleId(id: string): Tables['vehicles']['Row']['id'] {
  return id as Tables['vehicles']['Row']['id'];
}

export function asLeaseId(id: string): Tables['leases']['Row']['id'] {
  return id as Tables['leases']['Row']['id'];
}

export function asPaymentId(id: string): Tables['unified_payments']['Row']['id'] {
  return id as Tables['unified_payments']['Row']['id'];
}

export function asProfileId(id: string): Tables['profiles']['Row']['id'] {
  return id as Tables['profiles']['Row']['id'];
}

export function asImportId(id: string): string {
  return id as string;
}

export function asLeaseStatus(status: string): Tables['leases']['Row']['status'] {
  return status as Tables['leases']['Row']['status'];
}

export function asPaymentStatus(status: string): Tables['unified_payments']['Row']['status'] {
  return status as Tables['unified_payments']['Row']['status'];
}

export function castDbId(id: string): string {
  return id;
}

export function castLeaseUpdate(updates: Partial<Tables['leases']['Update']>): Tables['leases']['Update'] {
  return updates as Tables['leases']['Update'];
}

export function castProfileUpdate(updates: Partial<Tables['profiles']['Update']>): Tables['profiles']['Update'] {
  return updates as Tables['profiles']['Update'];
}

export function castPaymentUpdate(updates: Partial<Tables['unified_payments']['Update']>): Tables['unified_payments']['Update'] {
  return updates as Tables['unified_payments']['Update'];
}

// RPC function return types
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

export function castUnifiedPaymentLeaseId(id: string): Tables['unified_payments']['Row']['lease_id'] {
  return id as Tables['unified_payments']['Row']['lease_id'];
}
