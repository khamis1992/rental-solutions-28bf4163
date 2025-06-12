
import { Database } from './database';

export type Customer = Database['public']['Tables']['customers']['Row'] & {
  agreements?: Array<{
    id: string;
    start_date: string;
    end_date: string;
    status: string;
    rent_amount?: number;
    vehicle_make?: string;
    vehicle_model?: string;
    license_plate?: string;
  }>;
};

export type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
export type CustomerUpdate = Database['public']['Tables']['customers']['Update'];

export interface CustomerInfo {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  driver_license?: string;
  nationality?: string;
  address?: string;
}
