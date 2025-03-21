
export type AgreementStatus = 'active' | 'completed' | 'pending' | 'cancelled' | 'overdue';

export interface Agreement {
  id: string;
  customer_id: string;
  vehicle_id: string;
  start_date: string;
  end_date: string;
  status: AgreementStatus;
  total_cost: number;
  deposit_amount?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Extended fields from joins (not in DB table)
  customer?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string; // Added phone property to fix the TypeScript error
  };
  vehicle?: {
    id: string;
    make: string;
    model: string;
    license_plate: string;
    year: number;
    image_url?: string;
  };
}

export interface AgreementFormData {
  customer_id: string;
  vehicle_id: string;
  start_date: string;
  end_date: string;
  status: AgreementStatus;
  total_cost: number;
  deposit_amount?: number;
  notes?: string;
}

export interface AgreementFilterParams {
  status?: AgreementStatus;
  customer_id?: string;
  vehicle_id?: string;
  [key: string]: string | undefined;
}
