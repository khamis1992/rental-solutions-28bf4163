
/**
 * Core types for the Vehicle Management System
 * @module VehicleTypes
 */

import { Vehicle, VehicleStatus } from './vehicle';

/**
 * Extended vehicle information including maintenance and rental history
 */
export interface VehicleDetails extends Vehicle {
  maintenance_history?: MaintenanceRecord[];
  current_lease?: LeaseInfo;
  documents?: VehicleDocument[];
  metrics?: VehicleMetrics;
}

/**
 * Vehicle maintenance record
 */
interface MaintenanceRecord {
  id: string;
  service_type: string;
  service_date: string;
  cost: number;
  description?: string;
  status: 'scheduled' | 'in_progress' | 'completed';
}

/**
 * Basic lease information associated with a vehicle
 */
interface LeaseInfo {
  id: string;
  start_date: string;
  end_date: string;
  customer_name: string;
}

/**
 * Vehicle document types and metadata
 */
interface VehicleDocument {
  id: string;
  document_type: 'insurance' | 'registration' | 'maintenance' | 'inspection';
  document_url: string;
  expiry_date?: string;
}

/**
 * Vehicle performance and utilization metrics
 */
interface VehicleMetrics {
  utilization_rate: number;
  revenue_generated: number;
  maintenance_costs: number;
  availability_percentage: number;
}
