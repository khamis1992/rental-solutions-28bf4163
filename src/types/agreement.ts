
export interface Agreement {
  id: string;
  customer_id: string;
  vehicle_id: string;
  start_date: Date | string;
  end_date: Date | string;
  status: string;
  agreement_number: string;
  total_amount: number;
  deposit_amount: number;
  rent_amount: number;
  daily_late_fee?: number;
  notes?: string;
  additional_drivers?: string[];
  terms_accepted?: boolean;
  signature_url?: string;
  created_at?: string | Date;
  updated_at?: string | Date;
  rent_due_day?: number;
  profiles?: {
    id: string;
    full_name?: string;
    email?: string;
    phone_number?: string;
    address?: string;
    driver_license?: string;
  };
  vehicles?: {
    id: string;
    make?: string;
    model?: string;
    license_plate?: string;
    year?: number;
    color?: string;
    vin?: string;
    vehicle_type_id?: string;
    vehicleType?: {
      id: string;
      name: string;
    };
  };
}

export interface SimpleAgreement {
  id: string;
  status: string;
  agreement_number?: string;
  start_date?: string;
  end_date?: string;
  total_amount?: number;
  vehicles?: {
    make?: string;
    model?: string;
    license_plate?: string;
  };
}
