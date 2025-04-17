
export interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  service_type: string;
  description?: string;
  notes?: string;
  maintenance_type?: string;
  scheduled_date: string;
  status: MaintenanceStatus;
  completed_date?: string | null;
  performed_by?: string | null;
  cost?: number | null;
  created_at: string;
  updated_at: string;
  category_id?: string | null;
}

export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
