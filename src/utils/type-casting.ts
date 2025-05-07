
// Type-safe casting utilities for database IDs and statuses

/**
 * Cast a string to a specific table's ID type
 */
export function asTableId(tableName: string, id: string): string {
  return id;
}

/**
 * Cast a string to a vehicle ID
 */
export function asVehicleId(id: string): string {
  return id;
}

/**
 * Cast a string to an agreement/lease ID
 */
export function asAgreementId(id: string): string {
  return id;
}

/**
 * Cast a string to a customer/profile ID
 */
export function asCustomerId(id: string): string {
  return id;
}

/**
 * Cast a string to a payment ID
 */
export function asPaymentId(id: string): string {
  return id;
}

/**
 * Cast a string to a maintenance ID
 */
export function asMaintenanceId(id: string): string {
  return id;
}

/**
 * Cast a string value to a known status type
 */
export function asStatus<T extends string>(status: string): T {
  return status as T;
}

/**
 * Cast a string ID to a database ID type
 */
export function asDbId(id: string): string {
  return id;
}
