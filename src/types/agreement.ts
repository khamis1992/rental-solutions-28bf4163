
import { Database } from './database.types';

export type Agreement = Database['public']['Tables']['leases']['Row'] & {
  customers?: Database['public']['Tables']['profiles']['Row'];
  profiles?: Database['public']['Tables']['profiles']['Row'];
  vehicles?: Database['public']['Tables']['vehicles']['Row'];
  customer_name?: string;
  vehicle_info?: string;
  payment_day?: number; // Add payment_day property
};

export type AgreementInsert = Database['public']['Tables']['leases']['Insert'];
export type AgreementUpdate = Database['public']['Tables']['leases']['Update'];

// Re-export other types
export type { Database };
