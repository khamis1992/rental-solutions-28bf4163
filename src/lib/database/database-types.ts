
import { Database } from '@/types/database.types';

// Main database type
export type DbDatabase = Database;
export type DbTables = Database['public']['Tables'];

// Available table names - only include tables that exist in the schema
export type DbTableName = keyof DbTables;

// Core table types
export type LeaseRow = DbTables['leases']['Row'];
export type ProfileRow = DbTables['profiles']['Row'];
export type VehicleRow = DbTables['vehicles']['Row'];
export type UnifiedPaymentRow = DbTables['unified_payments']['Row'];
export type PaymentScheduleRow = DbTables['payment_schedules']['Row'];

// Additional types for tables not in main schema
export type TrafficFineRow = {
  id: string;
  lease_id: string;
  fine_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export type MaintenanceRow = {
  id: string;
  vehicle_id: string;
  maintenance_type: string;
  cost: number;
  status: string;
  created_at: string;
  updated_at: string;
};

// Status types
export type LeaseStatus = 'active' | 'closed' | 'cancelled' | 'draft' | 'pending' | 'expired';
export type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'sold' | 'retired';
export type PaymentStatus = 'pending' | 'completed' | 'overdue' | 'cancelled';
