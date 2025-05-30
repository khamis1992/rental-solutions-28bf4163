
import { Database } from './database.types';

export type Agreement = Database['public']['Tables']['leases']['Row'] & {
  customers?: Database['public']['Tables']['profiles']['Row'];
  profiles?: Database['public']['Tables']['profiles']['Row'];
  vehicles?: Database['public']['Tables']['vehicles']['Row'];
  customer_name?: string;
  vehicle_info?: string;
  payment_day?: number; // Now properly mapped to database column
  payment_frequency?: string; // Payment frequency field
  terms_accepted?: boolean; // Add missing property for form handling
  // Add missing vehicle properties for backward compatibility
  license_plate?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  // Ensure all required leases table properties are included
  confirmation_email_sent?: boolean;
  daily_late_fee?: number;
  deposit_amount?: number;
  down_payment?: number;
  notes?: string;
  // Add properties used in reports
  rent_due_day?: number;
  next_payment_date?: string;
};

export type AgreementInsert = Database['public']['Tables']['leases']['Insert'];
export type AgreementUpdate = Database['public']['Tables']['leases']['Update'];

export interface TableFilters {
  status?: string;
  customer?: string;
  vehicle?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

// Re-export other types
export type { Database };
