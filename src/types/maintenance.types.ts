
export interface MaintenanceRecord {
  id?: string; // Make id optional for both create and update operations
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
