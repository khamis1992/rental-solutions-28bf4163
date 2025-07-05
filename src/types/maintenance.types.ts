export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type MaintenanceType = 'routine' | 'repair' | 'inspection' | 'emergency';

export interface Maintenance {
  id: string;
  vehicle_id: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  description: string;
  date: string;
  cost?: number;
  technician?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
}

export interface MaintenanceFilterParams {
  vehicleId?: string;
  status?: MaintenanceStatus;
  type?: MaintenanceType;
  startDate?: string;
  endDate?: string;
}

export interface MaintenanceRecord {
  id: string; // Make id required to match hook expectations
  vehicle_id: string;
  service_type: string;
  maintenance_type: string;
  status: string;
  description: string;
  scheduled_date: string;
  completed_date?: string;
  cost?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  performed_by?: string;
  agreement_id?: string; // Add this field for compatibility
}

export interface MaintenanceFormData {
  id?: string; // Make id optional for form data
  vehicle_id: string;
  service_type: string;
  maintenance_type: string;
  status: string;
  description: string;
  scheduled_date: string;
  cost?: number;
  notes?: string;
  performed_by?: string;
  agreement_id?: string;
}

// Create maintenance record without ID for creation
export interface CreateMaintenanceRecord extends Omit<MaintenanceRecord, 'id'> {
  id?: string; // Optional for creation
}
