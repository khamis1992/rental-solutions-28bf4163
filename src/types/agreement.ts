
import { DbId, LeaseStatus } from '@/types/database-common';

export interface Agreement {
  id: string;
  agreement_number: string;
  customer_id: string;
  vehicle_id: string;
  start_date: string | null;
  end_date: string | null;
  rent_amount: number;
  total_amount: number;
  deposit_amount: number | null;
  status: LeaseStatus;
  notes: string | null;
  daily_late_fee: number | null;
  agreement_type: string;
  agreement_duration: any;
  created_at: string;
  updated_at: string;
  last_payment_date: string | null;
  payment_frequency: string;
  payment_day: number;
  // Join fields
  customers?: any;
  vehicles?: any;
}

export interface AgreementFormData {
  customer_id: string;
  vehicle_id: string;
  start_date: Date;
  end_date: Date;
  rent_amount: number;
  total_amount?: number;
  deposit_amount?: number;
  status?: LeaseStatus;
  notes?: string;
  daily_late_fee?: number;
  agreement_type: string;
  agreement_duration?: any;
  payment_frequency?: string;
  payment_day?: number;
}

export interface LeaseWithVehicle {
  id: string;
  status: LeaseStatus;
  start_date: string;
  end_date: string;
  agreement_number: string;
  vehicles: {
    id: string;
    make: string;
    model: string;
    year?: string | number;
    license_plate?: string;
    color?: string;
  };
}
