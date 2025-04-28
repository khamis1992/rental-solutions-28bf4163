
import { Database } from '@/types/database.types';
import { PostgrestSingleResponse } from '@supabase/supabase-js';

// Type definitions for database tables
export type Tables = Database['public']['Tables'];
export type Schema = keyof Database;

// Type guard to check if a response has data
export function hasData<T>(response: PostgrestSingleResponse<T>): response is PostgrestSingleResponse<T> & { data: T } {
  return response.data !== null && !response.error;
}

// Type guard for checking if data is valid
export function isValidData<T>(data: T | null | undefined): data is T {
  return data !== null && data !== undefined;
}

// Helper for safely retrieving data from a database response
export function safelyGetData<T>(response: PostgrestSingleResponse<T> | null): T | null {
  if (!response || response.error || !response.data) {
    return null;
  }
  return response.data;
}

// Safe accessor for object properties
export function safelyAccessData<T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | null {
  if (!obj) return null;
  return obj[key];
}

// Type-safe cast for table IDs
export function asTableId<T extends keyof Tables>(tableName: T, id: string): Tables[T]['Row']['id'] {
  return id as Tables[T]['Row']['id'];
}

// Type-safe cast for lease ID
export function asLeaseId(id: string): Tables['leases']['Row']['id'] {
  return id as Tables['leases']['Row']['id'];
}

// Type-safe cast for lease status
export function asLeaseStatus(status: string): Tables['leases']['Row']['status'] {
  return status as Tables['leases']['Row']['status'];
}

// Type-safe updater for leases
export function asLeaseUpdate(update: Partial<Tables['leases']['Update']>): Tables['leases']['Update'] {
  return update as Tables['leases']['Update'];
}

// Helper function to get import ID
export function asImportId(id: string): string {
  return id as string;
}

// Type helpers for RPC function results
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
