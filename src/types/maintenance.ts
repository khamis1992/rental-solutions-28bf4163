
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
  service_type?: string;
  category_id?: string;
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

export interface MaintenanceCategory {
  id: string;
  name: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MaintenanceFormProps {
  initialData?: Partial<MaintenanceRecord>;
  onSubmit: (data: any) => void;
  isEditMode?: boolean;
}

export interface MaintenanceFilterParams {
  status?: string;
  maintenance_type?: string;
  vehicle_id?: string;
  category_id?: string;
  date_range?: { from: Date; to: Date };
  search?: string;
}
