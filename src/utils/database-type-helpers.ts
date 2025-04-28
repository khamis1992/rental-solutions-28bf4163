
import { Database } from '@/types/database.types';

type Tables = Database['public']['Tables'];
type TableNames = keyof Tables;
type RowType<T extends TableNames> = Tables[T]['Row'];
type UpdateType<T extends TableNames> = Tables[T]['Update'];

// Generic type guard for any database response
export function exists<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// Type guard to check if object has expected properties
export function hasProperties<T extends object, K extends keyof T>(
  obj: T | null | undefined, 
  ...keys: K[]
): obj is T {
  if (!obj) return false;
  return keys.every(key => key in obj);
}

// Safely extract properties from a database result object
export function extractData<T>(result: any, fallback: T): T {
  if (!result) return fallback;
  if (result.error) return fallback;
  if (!result.data) return fallback;
  return result.data as T;
}

// Safe type casting functions for database fields
export function asTableId<T extends TableNames>(table: T, id: string): RowType<T>['id'] {
  return id as RowType<T>['id'];
}

export function asTableStatus<T extends TableNames>(table: T, status: string): RowType<T>['status'] {
  return status as RowType<T>['status'];
}

export function asTableUpdate<T extends TableNames>(table: T, updates: Partial<UpdateType<T>>): UpdateType<T> {
  return updates as UpdateType<T>;
}

// Specialized helpers for commonly used table operations
export function asLeaseId(id: string): Tables['leases']['Row']['id'] {
  return id as Tables['leases']['Row']['id'];
}

export function asPaymentId(id: string): Tables['unified_payments']['Row']['id'] {
  return id as Tables['unified_payments']['Row']['id'];
}

export function asVehicleId(id: string): Tables['vehicles']['Row']['id'] {
  return id as Tables['vehicles']['Row']['id'];
}

export function asTrafficFineId(id: string): Tables['traffic_fines']['Row']['id'] {
  return id as Tables['traffic_fines']['Row']['id'];
}

export function asImportId(id: string): Tables['agreement_imports']['Row']['id'] {
  return id as Tables['agreement_imports']['Row']['id'];
}

export function asMaintenanceId(id: string): Tables['maintenance']['Row']['id'] {
  return id as Tables['maintenance']['Row']['id'];
}

// Column-specific relation ID fields
export function asOverduePaymentAgreementId(id: string): Tables['overdue_payments']['Row']['agreement_id'] {
  return id as Tables['overdue_payments']['Row']['agreement_id'];
}

export function asUnifiedPaymentLeaseId(id: string): Tables['unified_payments']['Row']['lease_id'] {
  return id as Tables['unified_payments']['Row']['lease_id'];
}

export function asTrafficFineAgreementId(id: string): Tables['traffic_fines']['Row']['agreement_id'] {
  return id as Tables['traffic_fines']['Row']['agreement_id'];
}

// Status specific helpers
export function asLeaseStatus(status: string): Tables['leases']['Row']['status'] {
  return status as Tables['leases']['Row']['status'];
}

export function asPaymentStatus(status: string): Tables['unified_payments']['Row']['status'] {
  return status as Tables['unified_payments']['Row']['status'];
}

export function asVehicleStatus(status: string): Tables['vehicles']['Row']['status'] {
  return status as Tables['vehicles']['Row']['status'];
}

// Type-safe wrapper for database responses
export function handleDatabaseResponse<T>(response: any): T | null {
  if (!response || response.error) {
    console.error('Database error:', response?.error);
    return null;
  }
  return response.data as T;
}

// Cast functions for Update operations
export function asLeaseUpdate(updates: Partial<Tables['leases']['Update']>): Tables['leases']['Update'] {
  return updates as Tables['leases']['Update'];
}

export function asVehicleUpdate(updates: Partial<Tables['vehicles']['Update']>): Tables['vehicles']['Update'] {
  return updates as Tables['vehicles']['Update'];
}

export function castLeaseStatus(status: string): Tables['leases']['Row']['status'] {
  return status as Tables['leases']['Row']['status']; 
}

export function castLeaseUpdate(updates: Partial<Tables['leases']['Update']>): Tables['leases']['Update'] {
  return updates as Tables['leases']['Update'];
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
