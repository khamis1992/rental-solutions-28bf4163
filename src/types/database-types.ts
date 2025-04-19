
import { Database } from './database.types';

export type DbTables = Database['public']['Tables'];
export type SchemaName = keyof Database;

// ID Types 
export type LeaseId = DbTables['leases']['Row']['id'];
export type PaymentId = DbTables['unified_payments']['Row']['id'];
export type AgreementId = DbTables['leases']['Row']['id'];
export type VehicleId = DbTables['vehicles']['Row']['id'];
export type CustomerId = DbTables['profiles']['Row']['id'];
export type ImportId = string;

// Status Types
export type LeaseStatus = DbTables['leases']['Row']['status'];
export type PaymentStatus = DbTables['unified_payments']['Row']['status'];
export type VehicleStatus = DbTables['vehicles']['Row']['status'];

// Helper function for type casting
export function asDbId<T>(id: string): T {
  return id as T;
}

// Import UUID type from database-type-helpers instead of exporting it here
import { UUID, asTableId, hasData, asLeaseId, asPaymentId, asVehicleId, asCustomerId, 
  asAgreementId, asImportId, asLeaseIdColumn, asAgreementIdColumn, asImportIdColumn, 
  asTrafficFineIdColumn, asStatusColumn, asPaymentStatusColumn, safelyExtractData } from '@/utils/database-type-helpers';

// Re-export imported types and functions
export {
  UUID,
  asTableId,
  hasData,
  asLeaseId,
  asPaymentId,
  asVehicleId,
  asCustomerId,
  asAgreementId,
  asImportId,
  asLeaseIdColumn,
  asAgreementIdColumn,
  asImportIdColumn,
  asTrafficFineIdColumn,
  asStatusColumn,
  asPaymentStatusColumn,
  safelyExtractData
};
