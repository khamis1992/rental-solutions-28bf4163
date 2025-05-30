import { Database } from './database.types';

// Payment status types
export type PaymentStatus = Database['public']['Enums']['payment_status'];
export type AgreementStatus = Database['public']['Enums']['agreement_status'];
export type VehicleStatus = Database['public']['Enums']['vehicle_status'];

// Payment schedule status
export type PaymentScheduleStatus = 'pending' | 'completed' | 'overdue' | 'cancelled';

// Unified payment status (combines payment and schedule statuses)
export type UnifiedPaymentStatus = PaymentStatus | PaymentScheduleStatus | 'partially_paid';

// Type guard for payment status
export function isValidPaymentStatus(status: string): status is PaymentStatus {
  return ['pending', 'paid', 'overdue', 'cancelled', 'refunded'].includes(status);
}

// Type guard for agreement status
export function isValidAgreementStatus(status: string): status is AgreementStatus {
  return ['draft', 'pending', 'active', 'completed', 'cancelled', 'expired'].includes(status);
}

// Type guard for vehicle status
export function isValidVehicleStatus(status: string): status is VehicleStatus {
  return ['available', 'rented', 'maintenance', 'reserved', 'out_of_service'].includes(status);
}

// Type guard for payment schedule status
export function isValidPaymentScheduleStatus(status: string): status is PaymentScheduleStatus {
  return ['pending', 'completed', 'overdue', 'cancelled'].includes(status);
}

// Type guard for unified payment status
export function isValidUnifiedPaymentStatus(status: string): status is UnifiedPaymentStatus {
  return isValidPaymentStatus(status) || 
         isValidPaymentScheduleStatus(status) || 
         status === 'partially_paid';
}

// Helper to get display text for status
export function getStatusDisplayText(status: string): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper to get status color
export function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
    case 'paid':
    case 'active':
    case 'available':
      return 'success';
    case 'pending':
    case 'draft':
    case 'reserved':
      return 'warning';
    case 'overdue':
    case 'cancelled':
    case 'expired':
    case 'out_of_service':
      return 'error';
    case 'maintenance':
      return 'info';
    case 'partially_paid':
      return 'warning';
    default:
      return 'default';
  }
} 