
export interface Agreement {
  id: string;
  customerId: string;
  vehicleId: string;
  customer_id?: string;
  vehicle_id?: string;
  start_date: Date;
  end_date?: Date;
  status: string;
  agreementNumber: string;
  agreement_number?: string;
  total_amount?: number;
  deposit_amount?: number;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
  terms_accepted?: boolean;
  additional_drivers?: string[];
  customers?: {
    id: string;
    full_name?: string;
    email?: string;
    phone_number?: string;
    address?: string;
    driver_license?: string;
    nationality?: string;
  };
  vehicles?: {
    id: string;
    make?: string;
    model?: string;
    license_plate?: string;
    image_url?: string;
    year?: number;
    color?: string;
    vin?: string;
  };
  signature_url?: string;
}
