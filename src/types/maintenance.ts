
import { MaintenanceStatus, MaintenanceType } from '@/lib/validation-schemas/maintenance';
import { Vehicle } from './vehicle';

export interface MaintenanceFormData {
  vehicle_id: string;
  maintenance_type: keyof typeof MaintenanceType;
  status: string; // One of MaintenanceStatus values
  scheduled_date: Date;
  completion_date?: Date;
  description: string;
  cost: number;
  service_provider: string;
  invoice_number: string;
  odometer_reading: number;
  notes: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  maintenance_type: keyof typeof MaintenanceType;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  scheduled_date: string | Date;
  completion_date?: string | Date;
  description?: string;
  cost?: number;
  service_provider?: string;
  invoice_number?: string;
  odometer_reading?: number;
  notes?: string;
  created_at: string | Date;
  updated_at: string | Date;
  vehicle?: Vehicle;
}
