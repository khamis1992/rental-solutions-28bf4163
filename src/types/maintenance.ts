
export interface MaintenanceRecord {
  id?: string;
  maintenance_type: string;
  description?: string;
  cost?: number;
  scheduled_date: string | Date;
  completion_date?: string | Date | null;
  status: string;
  service_provider?: string;
  vehicle_id?: string;
  notes?: string;
  service_type?: string;
  category_id?: string;
  created_at?: string | Date;
  updated_at?: string | Date;
}
