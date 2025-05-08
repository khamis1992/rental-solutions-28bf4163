
/**
 * Maintenance record type definitions
 */
export interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  maintenance_type: string;
  description?: string;
  cost?: number;
  scheduled_date: string;
  completion_date?: string;
  status: string;
  service_provider?: string;
  invoice_number?: string;
  odometer_reading?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  vehicles?: {
    id: string;
    make: string;
    model: string;
    year: number;
    license_plate: string;
    color?: string;
    image_url?: string;
  };
}
