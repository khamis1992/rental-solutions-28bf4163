
import { Database } from '@/types/database.types';

// Define a type for UUID to make conversions more explicit
export type UUID = string;

// Helper function for type casting
export function asDbId<T>(id: string): T {
  return id as unknown as T;
}

// Type safe ID casting functions for specific tables
export function asLeaseId(id: string): Database['public']['Tables']['leases']['Row']['id'] {
  return id as Database['public']['Tables']['leases']['Row']['id'];
}

export function asVehicleId(id: string): Database['public']['Tables']['vehicles']['Row']['id'] {
  return id as Database['public']['Tables']['vehicles']['Row']['id'];
}

export function asCustomerId(id: string): Database['public']['Tables']['profiles']['Row']['id'] {
  return id as Database['public']['Tables']['profiles']['Row']['id'];
}

export function asPaymentId(id: string): Database['public']['Tables']['unified_payments']['Row']['id'] {
  return id as Database['public']['Tables']['unified_payments']['Row']['id'];
}

// For import-related operations
export function asImportId(id: string): string {
  return id;
}

// Type-safe casting functions for RPC results
export interface DeleteAgreementsByImportIdResult {
  success: boolean;
  deleted_count: number;
  message?: string;
}

export function castDeleteAgreementsResult(result: unknown): DeleteAgreementsByImportIdResult {
  return result as DeleteAgreementsByImportIdResult;
}

export interface RevertAgreementImportResult {
  success: boolean;
  deleted_count: number;
  message?: string;
}

export function castRevertAgreementImportResult(result: unknown): RevertAgreementImportResult {
  return result as RevertAgreementImportResult;
}

export interface GenerateAgreementDocumentResult {
  success: boolean;
  document_url?: string;
  message?: string;
}

export function castGenerateAgreementDocumentResult(result: unknown): GenerateAgreementDocumentResult {
  return result as GenerateAgreementDocumentResult;
}
