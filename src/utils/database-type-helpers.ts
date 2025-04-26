
import type { 
  LeaseId, 
  AgreementId, 
  PaymentId, 
  VehicleId, 
  CustomerId,
  ImportId,
  LeaseStatus,
  PaymentStatus
} from '@/types/database-types';

/**
 * Helper to cast a string ID to a typed lease ID for database operations
 * @param id ID string to cast
 * @returns The same ID with LeaseId type
 */
export function asLeaseIdColumn(id: string): LeaseId {
  return id as unknown as LeaseId;
}

/**
 * Helper to cast a string ID to a typed agreement ID for database operations
 * @param id ID string to cast
 * @returns The same ID with AgreementId type
 */
export function asAgreementIdColumn(id: string): AgreementId {
  return id as unknown as AgreementId;
}

/**
 * Helper to cast a string ID to a typed payment ID for database operations
 * @param id ID string to cast
 * @returns The same ID with PaymentId type
 */
export function asPaymentIdColumn(id: string): PaymentId {
  return id as unknown as PaymentId;
}

/**
 * Helper to cast a string ID to a typed vehicle ID for database operations
 * @param id ID string to cast
 * @returns The same ID with VehicleId type
 */
export function asVehicleIdColumn(id: string): VehicleId {
  return id as unknown as VehicleId;
}

/**
 * Helper to cast a string ID to a typed customer ID for database operations
 * @param id ID string to cast
 * @returns The same ID with CustomerId type
 */
export function asCustomerIdColumn(id: string): CustomerId {
  return id as unknown as CustomerId;
}

/**
 * Helper to cast a string ID to a typed import ID for database operations
 * @param id ID string to cast
 * @returns The same ID with ImportId type
 */
export function asImportIdColumn(id: string): ImportId {
  return id as unknown as ImportId;
}

/**
 * Helper to cast a string ID to a typed traffic fine ID for database operations
 * @param id ID string to cast
 * @returns The same ID with any type that matches the traffic fine ID
 */
export function asTrafficFineIdColumn(id: string): any {
  return id as any;
}

/**
 * Helper to cast a string status to a typed lease status for database operations
 * @param status Status string to cast
 * @returns The same status with LeaseStatus type
 */
export function asStatusColumn(status: string): LeaseStatus {
  return status as unknown as LeaseStatus;
}

/**
 * Helper to cast a string status to a typed payment status for database operations
 * @param status Status string to cast
 * @returns The same status with PaymentStatus type
 */
export function asPaymentStatusColumn(status: string): PaymentStatus {
  return status as unknown as PaymentStatus;
}

/**
 * Helper to extract data safely from a Supabase response
 * @param response Supabase response
 * @returns The data from the response, or null if there's an error
 */
export function safelyExtractData<T>(response: { data: T, error: any } | null): T | null {
  if (!response || response.error) {
    return null;
  }
  return response.data;
}

/**
 * Type-safe helper for matching foreign keys in the database
 * @param columnName Database column name
 * @param id ID to match
 */
export function asDbColumn<T>(columnName: string, id: string): Record<string, unknown> {
  return { [columnName]: id as unknown as T };
}

/**
 * Safe mapper for database records
 * @param record Database record to map
 * @param mapper Mapping function
 */
export function safeMapDbRecord<T, R>(record: T | null, mapper: (record: T) => R): R | null {
  if (!record) return null;
  return mapper(record);
}
