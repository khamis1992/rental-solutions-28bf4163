
/**
 * Type utility functions for safely casting values to database column types
 */

// Helper function to cast string to lease ID
export function asLeaseId(id: string): string {
  return id;
}

// Helper function to cast string to vehicle ID
export function asVehicleId(id: string): string {
  return id;
}

// Helper function to cast string to payment status
export function asPaymentStatus(status: string): string {
  return status;
}

// Helper function to cast string to traffic fine status
export function asTrafficFineStatus(status: string): string {
  return status;
}

// Helper function to safely cast string to UUID
export function asUUID(id: string): string {
  return id;
}

// Helper function to safely cast string to JSON
export function asJSON(data: any): any {
  return typeof data === 'string' ? JSON.parse(data) : data;
}

// Helper function to safely cast date to ISO string
export function asDateString(date: Date | string | null): string | null {
  if (!date) return null;
  return date instanceof Date ? date.toISOString() : date;
}
