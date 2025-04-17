
import { PostgrestSingleResponse } from '@supabase/supabase-js';

// Helper for safely casting database IDs
export function castDbId(id: string | undefined): string {
  return id || '';
}

export function asVehicleId(id: string | undefined): string {
  return id || '';
}

export function asLeaseId(id: string | undefined): string {
  return id || '';
}

export function asCustomerId(id: string | undefined): string {
  return id || '';
}

export function asProfileId(id: string | undefined): string {
  return id || '';
}

export function asPaymentId(id: string | undefined): string {
  return id || '';
}

export function asTrafficFineId(id: string | undefined): string {
  return id || '';
}

export function asLeaseIdColumn(id: string | undefined): string {
  return id || '';
}

export function asStatusColumn(status: string | undefined): string {
  return status || '';
}

export function asDatabaseType<T>(value: T): T {
  return value;
}

export function asString(value: string | undefined | null): string {
  return value || '';
}

export function asNumber(value: number | undefined | null): number {
  return value || 0;
}

export function asDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

export function castToUUID(value: string | undefined): string {
  return value || '';
}

export function safeProperty<T, K extends keyof T>(obj: T, key: K): T[K] | undefined {
  if (!obj) return undefined;
  return obj[key];
}

export function hasProperty<T, K extends string>(obj: any, key: K): obj is T & Record<K, any> {
  return obj && typeof obj === 'object' && key in obj;
}

export function hasData<T>(response: PostgrestSingleResponse<T> | { error: Error }): response is PostgrestSingleResponse<T> {
  if ('error' in response && response.error) {
    return false;
  }
  return 'data' in response;
}

export function safelyExtractData<T>(response: PostgrestSingleResponse<T> | null | undefined): T | null {
  if (!response) return null;
  if (!hasData(response)) return null;
  return response.data as T;
}

export function safeCastType<T>(value: unknown): T {
  return value as T;
}

// Safe array handling
export function safeArray<T>(arr: T | T[] | null | undefined): T[] {
  if (arr === null || arr === undefined) {
    return [];
  }
  
  return Array.isArray(arr) ? arr : [arr];
}

// Added the exists function
export function exists<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// Updated to properly handle type inference with arrays
export function flattenSafeArray<T>(arr: T[] | T[][] | null | undefined): T[] {
  const safeArr = safeArray(arr);
  // Use a type assertion here to handle the flattening properly
  return (Array.isArray(safeArr[0]) ? (safeArr as T[][]).flat() : safeArr as T[]);
}
