
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
