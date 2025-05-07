
import { LeaseStatus } from '@/types/lease-types';

export interface Agreement {
  id: string;
  status: LeaseStatus;
  customer_id: string;
  vehicle_id: string;
  start_date: Date;  // Changed from 'string | Date' to just 'Date'
  end_date: Date;    // Changed from 'string | Date' to just 'Date'
  total_amount: number;
  rent_amount?: number;
  payment_frequency?: string;
  payment_day?: number;
  created_at?: Date;  // Changed to Date
  updated_at?: Date;  // Changed to Date
  agreement_number?: string;
  agreement_type?: string;
  next_payment_date?: string;
  last_payment_date?: string;
  notes?: string;
  customers?: {
    id?: string;
    full_name?: string;
    email?: string;
    phone_number?: string;
  };
  vehicles?: {
    id?: string;
    make?: string;
    model?: string;
    year?: number;
    license_plate?: string;
    color?: string;
    vehicle_type?: string;
  };
  customer_name?: string;
  payments?: any[];
  daily_late_fee?: number;
  deposit_amount?: number;
  remaining_amount?: number;
  terms_accepted?: boolean;
  additional_drivers?: string[];
  license_plate?: string;
  vehicle_make?: string;
  vehicle_model?: string;
}

// Add any other agreement-related types here
export interface AgreementDetail extends Agreement {
  payments: {
    id: string;
    amount: number;
    payment_date: string;
    status: string;
  }[];
}

// Table filters
export interface TableFilters {
  status?: string[];
  date?: [Date | null, Date | null];
  search?: string;
  vehicleId?: string;
  customerId?: string;
  [key: string]: any;
}
