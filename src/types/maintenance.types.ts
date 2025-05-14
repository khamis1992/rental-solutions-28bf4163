/**
 * Maintenance Types
 * Type definitions for vehicle maintenance operations
 */
import { DbId } from './database-common';

/**
 * Maintenance statuses
 */
export enum MaintenanceStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  OVERDUE = 'overdue'
}

/**
 * Maintenance types
 */
export enum MaintenanceType {
  ROUTINE = 'routine',
  REPAIR = 'repair',
  INSPECTION = 'inspection',
  EMERGENCY = 'emergency',
  RECALL = 'recall',
  OTHER = 'other'
}

/**
 * Maintenance priority levels
 */
export enum MaintenancePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Maintenance category
 */
export interface MaintenanceCategory {
  id: DbId;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Maintenance record
 */
export interface Maintenance {
  id: DbId;
  vehicle_id: DbId;
  category_id?: DbId;
  title: string;
  description?: string;
  maintenance_type: MaintenanceType;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  cost?: number;
  scheduled_date?: string;
  completed_date?: string;
  odometer_reading?: number;
  technician_name?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  assigned_to?: string;
  parts_used?: string[];
  documents?: string[];
  next_maintenance_date?: string;
  next_maintenance_odometer?: number;
}

/**
 * Maintenance document
 */
export interface MaintenanceDocument {
  id: DbId;
  maintenance_id: DbId;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size?: number;
  uploaded_by?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Maintenance task
 */
export interface MaintenanceTask {
  id: DbId;
  maintenance_id: DbId;
  description: string;
  status: 'pending' | 'completed' | 'skipped';
  assigned_to?: string;
  estimated_time?: number;
  actual_time?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Paginated maintenance result
 */
export interface PaginatedMaintenanceResult {
  data: Maintenance[];
  count: number;
}

/**
 * For creating new maintenance records
 */
export type MaintenanceInsert = Omit<Maintenance, 'id' | 'created_at' | 'updated_at'>;

/**
 * For updating maintenance records
 */
export type MaintenanceUpdate = Partial<Maintenance>;

/**
 * Maintenance statistics
 */
export interface MaintenanceStatistics {
  totalRecords: number;
  pendingCount: number;
  completedCount: number;
  overdueTasks: number;
  totalCost: number;
  averageCost: number;
  commonCategories: Array<{category: string, count: number}>;
  costByMonth: Array<{month: string, cost: number}>;
}
