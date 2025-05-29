
export interface MaintenanceRecord {
  id: string;
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
}

export interface MaintenanceFormData {
  vehicle_id: string;
  service_type: string;
  maintenance_type: string;
  status: string;
  description: string;
  scheduled_date: string;
  cost?: number;
  notes?: string;
}
