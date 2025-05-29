
import { Database } from './database.types';

export type Agreement = Database['public']['Tables']['leases']['Row'] & {
  customers?: Database['public']['Tables']['profiles']['Row'];
  profiles?: Database['public']['Tables']['profiles']['Row'];
  vehicles?: Database['public']['Tables']['vehicles']['Row'];
  customer_name?: string;
  vehicle_info?: string;
  payment_day?: number; // Maps to rent_due_day in database
  rent_due_day?: number; // Direct database column
  terms_accepted?: boolean; // Add missing property for form handling
  // Add missing vehicle properties for backward compatibility
  license_plate?: string;
  vehicle_make?: string;
  vehicle_model?: string;
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
