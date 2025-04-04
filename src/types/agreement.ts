
// Create a new file for agreement types
export interface SimpleAgreement {
  id: string;
  agreement_number: string;
  customer_id: string;
  vehicle_id: string;
  start_date: string;
  end_date: string;
  status: string;
  daily_rate: number;
  signature_url?: string | null;
  created_at?: string;
  updated_at?: string;
  total_amount?: number;
  deposit_amount?: number;
  notes?: string;
  rent_amount?: number;
  daily_late_fee?: number;
  customer?: any;
  vehicle?: any;
}

export interface AgreementWithRelations extends SimpleAgreement {
  customer: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    plate_number: string;
  };
}
